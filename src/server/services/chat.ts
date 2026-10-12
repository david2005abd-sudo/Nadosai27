import {
  CONTEXT_MAX_MESSAGES,
  DEFAULT_MESSAGE_LIMIT,
  DEFAULT_TOKEN_LIMIT,
  MAX_OUTPUT_TOKENS,
} from "@/lib/constants";
import { estimateTokens } from "@/lib/text/estimate";
import { truncateTitle } from "@/lib/text/title";
import { getDayRangeUtc } from "@/lib/time/day";
import { ar } from "@/messages/ar";
import { getChatProvider } from "@/server/ai/factory";
import type { ChatProvider, ProviderMessage, ProviderUsage } from "@/server/ai/provider";
import { STREAM_HEADERS } from "@/server/http";
import {
  bumpConversationCounters,
  defaultConversationTitle,
  getConversationForUser,
  updateConversation,
} from "@/server/repositories/conversations";
import {
  countUserMessagesBetween,
  findAssistantReplyTo,
  findByClientMessageId,
  getContextMessages,
  getLastUserMessage,
  insertAssistantMessage,
  insertUserMessage,
  supersedeAssistantMessages,
} from "@/server/repositories/messages";
import { isModelEnabled } from "@/server/repositories/models";
import {
  hasNotificationOfTypeBetween,
  insertNotification,
} from "@/server/repositories/notifications";
import { getSystemSettings } from "@/server/repositories/settings";
import { insertUsageRecord, sumTokensBetween } from "@/server/repositories/usage";
import { selectContextMessages } from "@/server/services/context";
import {
  evaluateQuota,
  shouldInsertQuotaNotification,
  type QuotaLimits,
  type QuotaState,
} from "@/server/services/quota";
import { consumeChatRateLimit } from "@/server/services/rate-limit";
import type { Profile } from "@/types/db";

export type ChatErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "model_disabled"
  | "quota"
  | "rate_limit"
  | "provider"
  | "invalid"
  | "server";

export interface ChatError {
  kind: "error";
  status: number;
  code: ChatErrorCode;
  message: string;
}

export interface ChatReplay {
  kind: "replay";
  conversationId: string;
  content: string;
}

export interface ChatTurn {
  kind: "turn";
  userId: string;
  conversationId: string;
  userMessageId: string;
  provider: ChatProvider;
  providerName: string;
  model: string;
  isMock: boolean;
  messages: ProviderMessage[];
  contextEstimate: number;
  timezone: string;
  limits: QuotaLimits;
  stateBefore: QuotaState;
  startMs: number;
}

export type PreparedChat = ChatError | ChatReplay | ChatTurn;

export type DuplicateDecision =
  | { action: "insert" }
  | { action: "replay"; assistantContent: string }
  | { action: "reuse_existing"; userMessageId: string };

export function decideDuplicateTurn(
  existingUserMessage: { id: string } | null,
  existingAssistantReply: { content: string } | null,
): DuplicateDecision {
  if (!existingUserMessage) return { action: "insert" };
  if (existingAssistantReply) {
    return { action: "replay", assistantContent: existingAssistantReply.content };
  }
  return { action: "reuse_existing", userMessageId: existingUserMessage.id };
}

function chatError(status: number, code: ChatErrorCode, message: string): ChatError {
  return { kind: "error", status, code, message };
}

interface QuotaSnapshot {
  startIso: string;
  endIso: string;
  limits: QuotaLimits;
  state: QuotaState;
}

async function loadQuotaSnapshot(userId: string, timezone: string): Promise<QuotaSnapshot> {
  const { start, end } = getDayRangeUtc(timezone);
  const startIso = start.toISOString();
  const endIso = end.toISOString();
  const [settings, messagesToday, tokensToday] = await Promise.all([
    getSystemSettings(),
    countUserMessagesBetween(userId, startIso, endIso),
    sumTokensBetween(userId, startIso, endIso),
  ]);
  return {
    startIso,
    endIso,
    limits: {
      dailyMessageLimit: settings?.daily_message_limit ?? DEFAULT_MESSAGE_LIMIT,
      dailyTokenLimit: settings?.daily_token_limit ?? DEFAULT_TOKEN_LIMIT,
    },
    state: { messagesToday, tokensToday },
  };
}

async function recordLimitedRequest(
  userId: string,
  conversationId: string,
  startMs: number,
): Promise<void> {
  await insertUsageRecord({
    userId,
    conversationId,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    status: "limited",
    durationMs: Date.now() - startMs,
    metadata: {},
  });
}

async function buildTurn(params: {
  userId: string;
  conversationId: string;
  userMessageId: string;
  conversationModel: string;
  timezone: string;
  limits: QuotaLimits;
  state: QuotaState;
  startMs: number;
}): Promise<ChatTurn> {
  const contextRows = await getContextMessages(params.conversationId, CONTEXT_MAX_MESSAGES);
  const contextMessages: ProviderMessage[] = contextRows.map((row) => ({
    role: row.role === "assistant" ? "assistant" : "user",
    content: row.content,
  }));
  const selected = selectContextMessages(contextMessages);
  const selection = getChatProvider(params.conversationModel);
  const contextEstimate = selected.reduce(
    (sum, message) => sum + estimateTokens(message.content),
    0,
  );
  return {
    kind: "turn",
    userId: params.userId,
    conversationId: params.conversationId,
    userMessageId: params.userMessageId,
    provider: selection.provider,
    providerName: selection.provider.name,
    model: selection.model,
    isMock: selection.isMock,
    messages: selected,
    contextEstimate,
    timezone: params.timezone,
    limits: params.limits,
    stateBefore: params.state,
    startMs: params.startMs,
  };
}

export interface PrepareChatParams {
  userId: string;
  profile: Profile;
  conversationId: string;
  clientMessageId: string;
  content: string;
}

export async function prepareChatTurn(params: PrepareChatParams): Promise<PreparedChat> {
  const startMs = Date.now();
  const conversation = await getConversationForUser(params.conversationId, params.userId);
  if (!conversation) return chatError(404, "not_found", ar.app.chat.notFound);

  const modelEnabled = await isModelEnabled(conversation.model);
  if (!modelEnabled) return chatError(409, "model_disabled", ar.app.chat.unavailable);

  const snapshot = await loadQuotaSnapshot(params.userId, params.profile.timezone);

  const existing = await findByClientMessageId(conversation.id, params.clientMessageId);
  const existingReply = existing ? await findAssistantReplyTo(existing.id) : null;
  const decision = decideDuplicateTurn(existing, existingReply);

  let userMessageId: string;
  if (decision.action === "replay") {
    return {
      kind: "replay",
      conversationId: conversation.id,
      content: decision.assistantContent,
    };
  }

  if (decision.action === "reuse_existing") {
    userMessageId = decision.userMessageId;
  } else {
    const quotaDecision = evaluateQuota(snapshot.state, snapshot.limits);
    if (!quotaDecision.allowed) {
      await recordLimitedRequest(params.userId, conversation.id, startMs);
      return chatError(429, "quota", ar.errors.quota);
    }

    const rateAllowed = await consumeChatRateLimit(params.userId);
    if (!rateAllowed) {
      await recordLimitedRequest(params.userId, conversation.id, startMs);
      return chatError(429, "rate_limit", ar.errors.rateLimit);
    }

    const inserted = await insertUserMessage({
      conversationId: conversation.id,
      userId: params.userId,
      content: params.content,
      clientMessageId: params.clientMessageId,
    });

    if (!inserted.message) {
      if (!inserted.duplicate) return chatError(500, "server", ar.errors.serverError);
      const again = await findByClientMessageId(conversation.id, params.clientMessageId);
      if (!again) return chatError(500, "server", ar.errors.serverError);
      userMessageId = again.id;
    } else {
      userMessageId = inserted.message.id;
      if (conversation.message_count === 0 && conversation.title === defaultConversationTitle()) {
        const title = truncateTitle(params.content);
        if (title) {
          await updateConversation(conversation.id, params.userId, { title });
        }
      }
      await bumpConversationCounters(conversation.id);
    }
  }

  return buildTurn({
    userId: params.userId,
    conversationId: conversation.id,
    userMessageId,
    conversationModel: conversation.model,
    timezone: params.profile.timezone,
    limits: snapshot.limits,
    state: snapshot.state,
    startMs,
  });
}

export interface PrepareRegenerateParams {
  userId: string;
  profile: Profile;
  conversationId: string;
}

export async function prepareRegenerateTurn(
  params: PrepareRegenerateParams,
): Promise<PreparedChat> {
  const startMs = Date.now();
  const conversation = await getConversationForUser(params.conversationId, params.userId);
  if (!conversation) return chatError(404, "not_found", ar.app.chat.notFound);

  const modelEnabled = await isModelEnabled(conversation.model);
  if (!modelEnabled) return chatError(409, "model_disabled", ar.app.chat.unavailable);

  const lastUser = await getLastUserMessage(conversation.id);
  if (!lastUser) return chatError(400, "invalid", ar.app.chat.nothingToRegenerate);

  const snapshot = await loadQuotaSnapshot(params.userId, params.profile.timezone);
  if (snapshot.state.tokensToday >= snapshot.limits.dailyTokenLimit) {
    await recordLimitedRequest(params.userId, conversation.id, startMs);
    return chatError(429, "quota", ar.errors.quota);
  }

  const rateAllowed = await consumeChatRateLimit(params.userId);
  if (!rateAllowed) {
    await recordLimitedRequest(params.userId, conversation.id, startMs);
    return chatError(429, "rate_limit", ar.errors.rateLimit);
  }

  await supersedeAssistantMessages(conversation.id);

  return buildTurn({
    userId: params.userId,
    conversationId: conversation.id,
    userMessageId: lastUser.id,
    conversationModel: conversation.model,
    timezone: params.profile.timezone,
    limits: snapshot.limits,
    state: snapshot.state,
    startMs,
  });
}

export interface FinalizeChatParams {
  turn: ChatTurn;
  status: "ok" | "aborted" | "error";
  text: string;
  usage?: ProviderUsage;
}

export interface FinalizeChatResult {
  assistantMessageId: string | null;
  assistantContent: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  usageSource: "provider" | "estimate";
}

export async function finalizeChatTurn(params: FinalizeChatParams): Promise<FinalizeChatResult> {
  const { turn, status, text } = params;
  const usage = params.usage;
  const hasProviderUsage = Boolean(
    usage &&
    (usage.promptTokens !== undefined ||
      usage.completionTokens !== undefined ||
      usage.totalTokens !== undefined),
  );
  const usageSource: "provider" | "estimate" = hasProviderUsage ? "provider" : "estimate";
  const promptTokens = hasProviderUsage
    ? (usage?.promptTokens ?? turn.contextEstimate)
    : turn.contextEstimate;
  const completionTokens = hasProviderUsage
    ? (usage?.completionTokens ?? estimateTokens(text))
    : estimateTokens(text);
  const totalTokens = hasProviderUsage
    ? (usage?.totalTokens ?? promptTokens + completionTokens)
    : promptTokens + completionTokens;

  let assistantMessageId: string | null = null;
  if (text.length > 0) {
    const saved = await insertAssistantMessage({
      conversationId: turn.conversationId,
      userId: turn.userId,
      content: text,
      model: turn.model,
      inReplyTo: turn.userMessageId,
      provider: turn.providerName,
      usageSource,
      status,
      promptTokens,
      completionTokens,
      totalTokens,
    });
    assistantMessageId = saved?.id ?? null;
  }

  await insertUsageRecord({
    userId: turn.userId,
    conversationId: turn.conversationId,
    promptTokens,
    completionTokens,
    totalTokens,
    status,
    durationMs: Date.now() - turn.startMs,
    metadata: { provider: turn.providerName, usageSource, mock: turn.isMock },
  });

  await bumpConversationCounters(turn.conversationId);

  const stateAfter: QuotaState = {
    messagesToday: turn.stateBefore.messagesToday + 1,
    tokensToday: turn.stateBefore.tokensToday + totalTokens,
  };
  const { start, end } = getDayRangeUtc(turn.timezone);
  const alreadyNotified = await hasNotificationOfTypeBetween(
    turn.userId,
    "quota",
    start.toISOString(),
    end.toISOString(),
  );
  if (shouldInsertQuotaNotification(stateAfter, turn.limits, alreadyNotified)) {
    await insertNotification({
      userId: turn.userId,
      title: ar.app.notifications.quotaTitle,
      body: ar.app.notifications.quotaBody,
      type: "quota",
      actionUrl: "/app/usage",
    });
  }

  return {
    assistantMessageId,
    assistantContent: text,
    promptTokens,
    completionTokens,
    totalTokens,
    usageSource,
  };
}

export interface ChatStreamRun {
  response: Response;
  completion: Promise<FinalizeChatResult | null>;
}

export function runTurnStream(turn: ChatTurn, signal: AbortSignal): ChatStreamRun {
  const encoder = new TextEncoder();
  let resolveCompletion: (value: FinalizeChatResult | null) => void = () => {
    void 0;
  };
  const completion = new Promise<FinalizeChatResult | null>((resolve) => {
    resolveCompletion = resolve;
  });
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let text = "";
      let status: "ok" | "aborted" | "error" = "ok";
      let usage: ProviderUsage | undefined;
      try {
        const providerStream = turn.provider.stream({
          messages: turn.messages,
          signal,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        });
        for await (const chunk of providerStream.textStream) {
          text += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
        usage = await providerStream.usage;
      } catch {
        status = signal.aborted ? "aborted" : "error";
      }
      try {
        const result = await finalizeChatTurn({ turn, status, text, usage });
        resolveCompletion(result);
      } catch {
        resolveCompletion(null);
      }
      controller.close();
    },
  });
  return { response: new Response(stream, { headers: STREAM_HEADERS }), completion };
}
