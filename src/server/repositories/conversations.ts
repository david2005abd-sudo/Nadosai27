import { getAdminSupabase } from "@/server/supabase/admin";
import type { Conversation } from "@/types/db";

const DEFAULT_TITLE = "محادثة جديدة";

export function defaultConversationTitle(): string {
  return DEFAULT_TITLE;
}

export async function createConversation(
  userId: string,
  model: string,
  title?: string,
): Promise<Conversation | null> {
  const { data, error } = await getAdminSupabase()
    .from("conversations")
    .insert({ user_id: userId, model, title: title ?? DEFAULT_TITLE })
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function getConversationForUser(
  id: string,
  userId: string,
): Promise<Conversation | null> {
  const { data, error } = await getAdminSupabase()
    .from("conversations")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export interface ListConversationsParams {
  archived: boolean;
  limit: number;
  offset: number;
}

export async function listConversations(
  userId: string,
  params: ListConversationsParams,
): Promise<Conversation[]> {
  const { data, error } = await getAdminSupabase()
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .eq("is_archived", params.archived)
    .order("is_pinned", { ascending: false })
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .range(params.offset, params.offset + params.limit - 1);
  if (error || !data) return [];
  return data;
}

export async function countPinned(userId: string): Promise<number> {
  const { count } = await getAdminSupabase()
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_pinned", true);
  return count ?? 0;
}

export interface ConversationPatch {
  title?: string;
  is_archived?: boolean;
  is_pinned?: boolean;
}

export async function updateConversation(
  id: string,
  userId: string,
  patch: ConversationPatch,
): Promise<Conversation | null> {
  const { data, error } = await getAdminSupabase()
    .from("conversations")
    .update(patch)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function deleteConversation(id: string, userId: string): Promise<boolean> {
  const { error } = await getAdminSupabase()
    .from("conversations")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  return !error;
}

export async function bumpConversationCounters(id: string): Promise<void> {
  const admin = getAdminSupabase();
  const { count } = await admin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", id);
  await admin
    .from("conversations")
    .update({ message_count: count ?? 0, last_message_at: new Date().toISOString() })
    .eq("id", id);
}

export async function setConversationModel(id: string, model: string): Promise<void> {
  await getAdminSupabase().from("conversations").update({ model }).eq("id", id);
}

export async function countConversations(userId: string): Promise<number> {
  const { count } = await getAdminSupabase()
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
}

export async function searchConversationsByTitle(
  userId: string,
  pattern: string,
  limit: number,
): Promise<Conversation[]> {
  const { data, error } = await getAdminSupabase()
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .ilike("title", pattern)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error || !data) return [];
  return data;
}

export async function countAllConversations(): Promise<number> {
  const { count } = await getAdminSupabase()
    .from("conversations")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}
