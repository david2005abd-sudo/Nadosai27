import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth";
import { getConversationForUser } from "@/server/repositories/conversations";
import { listConversationMessages } from "@/server/repositories/messages";
import { getVotesForMessages } from "@/server/repositories/message-feedback";
import { ChatRoom, type ChatMessage } from "@/components/chat/ChatRoom";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const conversation = await getConversationForUser(id, user.id);
  if (!conversation) notFound();

  const messages = await listConversationMessages(id);
  const votes = await getVotesForMessages(
    user.id,
    messages.map((message) => message.id),
  );

  const initialMessages: ChatMessage[] = messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => {
      const metadata = (message.metadata ?? {}) as { provider?: string; status?: string };
      return {
        id: message.id,
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
        createdAt: message.created_at,
        model: message.model,
        provider: metadata.provider ?? null,
        status: metadata.status ?? null,
        vote: votes.get(message.id) ?? null,
      };
    });

  return (
    <ChatRoom
      conversationId={conversation.id}
      initialTitle={conversation.title}
      initialMessages={initialMessages}
    />
  );
}
