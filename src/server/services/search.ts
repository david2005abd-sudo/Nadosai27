import { SEARCH_LIMIT } from "@/lib/constants";
import { escapeLikePattern } from "@/lib/text/escape";
import { searchConversationsByTitle } from "@/server/repositories/conversations";
import { searchMessages } from "@/server/repositories/messages";

export interface SearchResultItem {
  type: "conversation" | "message";
  conversationId: string;
  title: string;
  snippet: string | null;
  role: string | null;
  createdAt: string;
}

function buildSnippet(content: string, query: string, radius = 80): string {
  const index = content.toLowerCase().indexOf(query.toLowerCase());
  if (index < 0) return content.slice(0, radius * 2).trim();
  const start = Math.max(0, index - radius);
  const end = Math.min(content.length, index + query.length + radius);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < content.length ? "…" : "";
  return `${prefix}${content.slice(start, end).trim()}${suffix}`;
}

export async function searchEverything(userId: string, query: string): Promise<SearchResultItem[]> {
  const pattern = `%${escapeLikePattern(query)}%`;
  const [conversationHits, messageHits] = await Promise.all([
    searchConversationsByTitle(userId, pattern, SEARCH_LIMIT),
    searchMessages(userId, pattern, SEARCH_LIMIT),
  ]);

  const items: SearchResultItem[] = [
    ...conversationHits.map((conversation) => ({
      type: "conversation" as const,
      conversationId: conversation.id,
      title: conversation.title,
      snippet: null,
      role: null,
      createdAt: conversation.last_message_at ?? conversation.created_at,
    })),
    ...messageHits.map((hit) => ({
      type: "message" as const,
      conversationId: hit.conversationId,
      title: hit.conversationTitle,
      snippet: buildSnippet(hit.content, query),
      role: hit.role,
      createdAt: hit.createdAt,
    })),
  ];

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return items.slice(0, SEARCH_LIMIT);
}
