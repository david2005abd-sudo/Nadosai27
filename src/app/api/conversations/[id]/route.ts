import type { NextRequest } from "next/server";
import { ar } from "@/messages/ar";
import { conversationUpdateSchema } from "@/lib/validation/schemas";
import { authenticateApiUser } from "@/server/auth";
import { firstIssueMessage, jsonError } from "@/server/http";
import {
  countPinned,
  deleteConversation,
  getConversationForUser,
  updateConversation,
} from "@/server/repositories/conversations";
import { writeAudit } from "@/server/services/audit";
import { PINNED_MAX } from "@/lib/constants";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await authenticateApiUser();
  if (!auth.ok) {
    return jsonError(
      auth.status,
      auth.code,
      auth.code === "forbidden" ? ar.errors.inactive : ar.errors.unauthorized,
    );
  }

  const { id } = await context.params;
  const conversation = await getConversationForUser(id, auth.userId);
  if (!conversation) {
    return jsonError(404, "not_found", ar.errors.notFound);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "invalid", ar.errors.invalid);
  }

  const parsed = conversationUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "invalid", firstIssueMessage(parsed.error) ?? ar.errors.invalid);
  }

  if (parsed.data.isPinned === true && !conversation.is_pinned) {
    const pinnedCount = await countPinned(auth.userId);
    if (pinnedCount >= PINNED_MAX) {
      return jsonError(400, "invalid", ar.app.sidebar.pinLimit);
    }
  }

  const patch: { title?: string; is_archived?: boolean; is_pinned?: boolean } = {};
  if (parsed.data.title !== undefined) patch.title = parsed.data.title;
  if (parsed.data.isArchived !== undefined) patch.is_archived = parsed.data.isArchived;
  if (parsed.data.isPinned !== undefined) patch.is_pinned = parsed.data.isPinned;

  const updated = await updateConversation(id, auth.userId, patch);
  if (!updated) {
    return jsonError(500, "server", ar.errors.serverError);
  }

  return Response.json({
    conversation: {
      id: updated.id,
      title: updated.title,
      isPinned: updated.is_pinned,
      isArchived: updated.is_archived,
    },
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await authenticateApiUser();
  if (!auth.ok) {
    return jsonError(
      auth.status,
      auth.code,
      auth.code === "forbidden" ? ar.errors.inactive : ar.errors.unauthorized,
    );
  }

  const { id } = await context.params;
  const conversation = await getConversationForUser(id, auth.userId);
  if (!conversation) {
    return jsonError(404, "not_found", ar.errors.notFound);
  }

  const deleted = await deleteConversation(id, auth.userId);
  if (!deleted) {
    return jsonError(500, "server", ar.errors.serverError);
  }

  await writeAudit({
    userId: auth.userId,
    action: "conversation_deleted",
    entityType: "conversation",
    entityId: id,
    request,
  });

  return Response.json({ ok: true });
}
