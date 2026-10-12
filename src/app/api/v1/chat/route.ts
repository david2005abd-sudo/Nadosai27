import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { MAX_OUTPUT_TOKENS } from "@/lib/constants";
import { truncateTitle } from "@/lib/text/title";
import { v1ChatRequestSchema } from "@/lib/validation/schemas";
import { ar } from "@/messages/ar";
import { firstIssueMessage, jsonError } from "@/server/http";
import { findApiKeyByHash, touchApiKeyLastUsed } from "@/server/repositories/api-keys";
import { createConversation, getConversationForUser } from "@/server/repositories/conversations";
import { isModelEnabled } from "@/server/repositories/models";
import { getProfileById } from "@/server/repositories/profiles";
import { getSystemSettings } from "@/server/repositories/settings";
import { extractBearerToken, hashApiKey, isApiKeyUsable } from "@/server/services/api-keys";
import {
  finalizeChatTurn,
  prepareChatTurn,
  type ChatError,
  type ChatErrorCode,
} from "@/server/services/chat";
import type { ProviderUsage } from "@/server/ai/provider";

export const runtime = "nodejs";
export const maxDuration = 60;

const V1_CODES: Record<ChatErrorCode, string> = {
  unauthorized: "unauthorized",
  forbidden: "forbidden",
  quota: "quota",
  rate_limit: "rate_limit",
  provider: "provider",
  not_found: "invalid",
  model_disabled: "invalid",
  invalid: "invalid",
  server: "provider",
};

function mapChatError(error: ChatError): Response {
  const code = V1_CODES[error.code];
  const status = code === "provider" ? 502 : error.status;
  return jsonError(status, code, error.message);
}

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request.headers.get("authorization"));
  if (!token) {
    return jsonError(401, "unauthorized", ar.errors.unauthorized);
  }

  const key = await findApiKeyByHash(hashApiKey(token));
  if (!key || !isApiKeyUsable(key)) {
    return jsonError(401, "unauthorized", ar.errors.unauthorized);
  }

  const profile = await getProfileById(key.user_id);
  if (!profile) {
    return jsonError(401, "unauthorized", ar.errors.unauthorized);
  }
  if (!profile.is_active) {
    return jsonError(403, "forbidden", ar.errors.inactive);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "invalid", ar.errors.invalid);
  }

  const parsed = v1ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "invalid", firstIssueMessage(parsed.error) ?? ar.errors.invalid);
  }

  let conversationId = parsed.data.conversationId ?? null;
  if (conversationId) {
    const conversation = await getConversationForUser(conversationId, key.user_id);
    if (!conversation) {
      return jsonError(400, "invalid", ar.errors.invalid);
    }
  } else {
    const settings = await getSystemSettings();
    const model = settings?.default_model;
    if (!model) {
      return jsonError(502, "provider", ar.errors.serverError);
    }
    const enabled = await isModelEnabled(model);
    if (!enabled) {
      return jsonError(400, "invalid", ar.app.chat.unavailable);
    }
    const created = await createConversation(key.user_id, model, truncateTitle(key.name, 120));
    if (!created) {
      return jsonError(502, "provider", ar.errors.serverError);
    }
    conversationId = created.id;
  }

  const prepared = await prepareChatTurn({
    userId: key.user_id,
    profile,
    conversationId,
    clientMessageId: randomUUID(),
    content: parsed.data.content,
  });

  if (prepared.kind === "error") {
    return mapChatError(prepared);
  }
  if (prepared.kind === "replay") {
    return jsonError(502, "provider", ar.errors.provider);
  }

  await touchApiKeyLastUsed(key.id);

  let text = "";
  let usage: ProviderUsage | undefined;
  let status: "ok" | "error" = "ok";
  try {
    const providerStream = prepared.provider.stream({
      messages: prepared.messages,
      signal: request.signal,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });
    for await (const chunk of providerStream.textStream) {
      text += chunk;
    }
    usage = await providerStream.usage;
  } catch {
    status = "error";
  }

  const result = await finalizeChatTurn({
    turn: prepared,
    status,
    text: status === "ok" ? text : "",
    usage,
  });

  if (status !== "ok" || !result.assistantMessageId) {
    return jsonError(502, "provider", ar.errors.provider);
  }

  return Response.json({
    id: result.assistantMessageId,
    conversationId: prepared.conversationId,
    content: result.assistantContent,
    model: prepared.model,
    usage: {
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      totalTokens: result.totalTokens,
    },
  });
}
