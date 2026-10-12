import type { NextRequest } from "next/server";
import { CONVERSATION_PAGE_SIZE } from "@/lib/constants";
import { ar } from "@/messages/ar";
import { conversationCreateSchema } from "@/lib/validation/schemas";
import { authenticateApiUser } from "@/server/auth";
import { firstIssueMessage, jsonError } from "@/server/http";
import { createConversation, listConversations } from "@/server/repositories/conversations";
import { isModelEnabled } from "@/server/repositories/models";
import { getSystemSettings } from "@/server/repositories/settings";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await authenticateApiUser();
  if (!auth.ok) {
    return jsonError(
      auth.status,
      auth.code,
      auth.code === "forbidden" ? ar.errors.inactive : ar.errors.unauthorized,
    );
  }

  const archived = request.nextUrl.searchParams.get("archived") === "1";
  const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? CONVERSATION_PAGE_SIZE);
  const offsetParam = Number(request.nextUrl.searchParams.get("offset") ?? 0);
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(Math.trunc(limitParam), 1), CONVERSATION_PAGE_SIZE)
    : CONVERSATION_PAGE_SIZE;
  const offset = Number.isFinite(offsetParam) ? Math.max(Math.trunc(offsetParam), 0) : 0;

  const conversations = await listConversations(auth.userId, { archived, limit, offset });
  return Response.json({
    conversations: conversations.map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
      isPinned: conversation.is_pinned,
      isArchived: conversation.is_archived,
      lastMessageAt: conversation.last_message_at,
      messageCount: conversation.message_count,
    })),
    limit,
    offset,
  });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateApiUser();
  if (!auth.ok) {
    return jsonError(
      auth.status,
      auth.code,
      auth.code === "forbidden" ? ar.errors.inactive : ar.errors.unauthorized,
    );
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = conversationCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "invalid", firstIssueMessage(parsed.error) ?? ar.errors.invalid);
  }

  const settings = await getSystemSettings();
  const model = settings?.default_model;
  if (!model) {
    return jsonError(500, "server", ar.errors.serverError);
  }
  const enabled = await isModelEnabled(model);
  if (!enabled) {
    return jsonError(409, "model_disabled", ar.app.chat.unavailable);
  }

  const conversation = await createConversation(auth.userId, model, parsed.data.title);
  if (!conversation) {
    return jsonError(500, "server", ar.errors.serverError);
  }

  return Response.json({ id: conversation.id });
}
