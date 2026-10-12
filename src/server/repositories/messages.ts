import { getAdminSupabase } from "@/server/supabase/admin";
import type { Json, Message } from "@/types/db";

export interface InsertUserMessageParams {
  conversationId: string;
  userId: string;
  content: string;
  clientMessageId: string;
}

export interface InsertUserMessageResult {
  message: Message | null;
  duplicate: boolean;
}

export async function findByClientMessageId(
  conversationId: string,
  clientMessageId: string,
): Promise<Message | null> {
  const { data, error } = await getAdminSupabase()
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("client_message_id", clientMessageId)
    .eq("role", "user")
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function insertUserMessage(
  params: InsertUserMessageParams,
): Promise<InsertUserMessageResult> {
  const { data, error } = await getAdminSupabase()
    .from("messages")
    .insert({
      conversation_id: params.conversationId,
      user_id: params.userId,
      role: "user",
      content: params.content,
      client_message_id: params.clientMessageId,
    })
    .select("*")
    .maybeSingle();
  if (error) {
    if (error.code === "23505") {
      const existing = await findByClientMessageId(params.conversationId, params.clientMessageId);
      return { message: existing, duplicate: true };
    }
    return { message: null, duplicate: false };
  }
  return { message: data, duplicate: false };
}

export interface InsertAssistantMessageParams {
  conversationId: string;
  userId: string;
  content: string;
  model: string;
  inReplyTo: string;
  provider: string;
  usageSource: "provider" | "estimate";
  status: "ok" | "aborted" | "error";
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export async function insertAssistantMessage(
  params: InsertAssistantMessageParams,
): Promise<Message | null> {
  const metadata: Json = {
    provider: params.provider,
    usageSource: params.usageSource,
    in_reply_to: params.inReplyTo,
    status: params.status,
  };
  const { data, error } = await getAdminSupabase()
    .from("messages")
    .insert({
      conversation_id: params.conversationId,
      user_id: params.userId,
      role: "assistant",
      content: params.content,
      model: params.model,
      prompt_tokens: params.promptTokens,
      completion_tokens: params.completionTokens,
      total_tokens: params.totalTokens,
      metadata,
    })
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function findAssistantReplyTo(userMessageId: string): Promise<Message | null> {
  const { data, error } = await getAdminSupabase()
    .from("messages")
    .select("*")
    .eq("role", "assistant")
    .eq("superseded", false)
    .contains("metadata", { in_reply_to: userMessageId })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function listConversationMessages(
  conversationId: string,
  includeSuperseded = false,
): Promise<Message[]> {
  let query = getAdminSupabase()
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  if (!includeSuperseded) query = query.eq("superseded", false);
  const { data, error } = await query;
  if (error || !data) return [];
  return data;
}

export async function getLastUserMessage(conversationId: string): Promise<Message | null> {
  const { data, error } = await getAdminSupabase()
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("role", "user")
    .eq("superseded", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function getContextMessages(
  conversationId: string,
  limit: number,
): Promise<Message[]> {
  const { data, error } = await getAdminSupabase()
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("superseded", false)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.reverse();
}

export async function supersedeAssistantMessages(conversationId: string): Promise<void> {
  await getAdminSupabase()
    .from("messages")
    .update({ superseded: true })
    .eq("conversation_id", conversationId)
    .eq("role", "assistant")
    .eq("superseded", false);
}

export async function getMessageForUser(
  messageId: string,
  userId: string,
): Promise<Message | null> {
  const { data, error } = await getAdminSupabase()
    .from("messages")
    .select("*")
    .eq("id", messageId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function countUserMessagesBetween(
  userId: string,
  startIso: string,
  endIso: string,
): Promise<number> {
  const { count } = await getAdminSupabase()
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("role", "user")
    .gte("created_at", startIso)
    .lt("created_at", endIso);
  return count ?? 0;
}

export interface SearchMessageHit {
  messageId: string;
  conversationId: string;
  conversationTitle: string;
  content: string;
  role: string;
  createdAt: string;
}

interface SearchRow {
  id: string;
  conversation_id: string;
  content: string;
  role: string;
  created_at: string;
  conversations: { title: string } | null;
}

export async function searchMessages(
  userId: string,
  pattern: string,
  limit: number,
): Promise<SearchMessageHit[]> {
  const { data, error } = await getAdminSupabase()
    .from("messages")
    .select("id, conversation_id, content, role, created_at, conversations!inner(title, user_id)")
    .eq("user_id", userId)
    .ilike("content", pattern)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  const rows = data as unknown as SearchRow[];
  return rows
    .filter((row) => row.conversations !== null)
    .map((row) => ({
      messageId: row.id,
      conversationId: row.conversation_id,
      conversationTitle: row.conversations?.title ?? "",
      content: row.content,
      role: row.role,
      createdAt: row.created_at,
    }));
}

export async function listUserMessageDates(userId: string, sinceIso: string): Promise<string[]> {
  const { data, error } = await getAdminSupabase()
    .from("messages")
    .select("created_at")
    .eq("user_id", userId)
    .eq("role", "user")
    .gte("created_at", sinceIso);
  if (error || !data) return [];
  return data.map((row) => row.created_at);
}

export async function countAllMessagesToday(startIso: string, endIso: string): Promise<number> {
  const { count } = await getAdminSupabase()
    .from("messages")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startIso)
    .lt("created_at", endIso);
  return count ?? 0;
}

export async function listRecentAssistantMessages(
  userId: string,
  sinceIso: string,
): Promise<{ conversationId: string; totalTokens: number; createdAt: string }[]> {
  const { data, error } = await getAdminSupabase()
    .from("messages")
    .select("conversation_id, total_tokens, created_at")
    .eq("user_id", userId)
    .eq("role", "assistant")
    .gte("created_at", sinceIso);
  if (error || !data) return [];
  return data.map((row) => ({
    conversationId: row.conversation_id,
    totalTokens: row.total_tokens,
    createdAt: row.created_at,
  }));
}
