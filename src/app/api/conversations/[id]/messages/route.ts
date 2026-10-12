import { ar } from "@/messages/ar";
import { authenticateApiUser } from "@/server/auth";
import { jsonError } from "@/server/http";
import { getConversationForUser } from "@/server/repositories/conversations";
import { listConversationMessages } from "@/server/repositories/messages";
import { getVotesForMessages } from "@/server/repositories/message-feedback";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
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
    return jsonError(404, "not_found", ar.app.chat.notFound);
  }

  const messages = await listConversationMessages(id);
  const votes = await getVotesForMessages(
    auth.userId,
    messages.map((message) => message.id),
  );

  return Response.json({
    conversation: {
      id: conversation.id,
      title: conversation.title,
      model: conversation.model,
      isPinned: conversation.is_pinned,
      isArchived: conversation.is_archived,
    },
    messages: messages.map((message) => {
      const metadata = (message.metadata ?? {}) as { provider?: string; status?: string };
      return {
        id: message.id,
        role: message.role,
        content: message.content,
        model: message.model,
        createdAt: message.created_at,
        provider: metadata.provider ?? null,
        status: metadata.status ?? null,
        vote: votes.get(message.id) ?? null,
      };
    }),
  });
}
