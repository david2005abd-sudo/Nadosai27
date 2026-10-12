import { getAdminSupabase } from "@/server/supabase/admin";
import type { SavedSnippet } from "@/types/db";

export async function listSnippets(userId: string): Promise<SavedSnippet[]> {
  const { data, error } = await getAdminSupabase()
    .from("saved_snippets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data;
}

export interface InsertSnippetParams {
  userId: string;
  title: string;
  content: string;
  sourceMessageId?: string | null;
}

export async function insertSnippet(params: InsertSnippetParams): Promise<SavedSnippet | null> {
  const { data, error } = await getAdminSupabase()
    .from("saved_snippets")
    .insert({
      user_id: params.userId,
      title: params.title,
      content: params.content,
      source_message_id: params.sourceMessageId ?? null,
    })
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function deleteSnippet(userId: string, id: string): Promise<boolean> {
  const { error } = await getAdminSupabase()
    .from("saved_snippets")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  return !error;
}
