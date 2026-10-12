import { getAdminSupabase } from "@/server/supabase/admin";
import type { Json, UsageRecord } from "@/types/db";

export interface InsertUsageParams {
  userId: string;
  conversationId: string | null;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  status: "ok" | "error" | "aborted" | "limited";
  durationMs: number;
  metadata: Json;
}

export async function insertUsageRecord(params: InsertUsageParams): Promise<void> {
  await getAdminSupabase().from("usage_records").insert({
    user_id: params.userId,
    conversation_id: params.conversationId,
    prompt_tokens: params.promptTokens,
    completion_tokens: params.completionTokens,
    total_tokens: params.totalTokens,
    request_status: params.status,
    request_duration_ms: params.durationMs,
    metadata: params.metadata,
  });
}

export async function sumTokensBetween(
  userId: string,
  startIso: string,
  endIso: string,
): Promise<number> {
  const { data, error } = await getAdminSupabase()
    .from("usage_records")
    .select("total_tokens")
    .eq("user_id", userId)
    .gte("created_at", startIso)
    .lt("created_at", endIso);
  if (error || !data) return 0;
  let sum = 0;
  for (const row of data) sum += row.total_tokens;
  return sum;
}

export interface UsageRecordLite {
  totalTokens: number;
  createdAt: string;
}

export async function listUsageSince(userId: string, sinceIso: string): Promise<UsageRecordLite[]> {
  const { data, error } = await getAdminSupabase()
    .from("usage_records")
    .select("total_tokens, created_at")
    .eq("user_id", userId)
    .gte("created_at", sinceIso);
  if (error || !data) return [];
  return data.map((row) => ({ totalTokens: row.total_tokens, createdAt: row.created_at }));
}

export async function listRecentUsageForAdmin(limit: number): Promise<UsageRecord[]> {
  const { data, error } = await getAdminSupabase()
    .from("usage_records")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data;
}

export async function listUsageSinceAll(sinceIso: string): Promise<UsageRecordLite[]> {
  const { data, error } = await getAdminSupabase()
    .from("usage_records")
    .select("total_tokens, created_at")
    .gte("created_at", sinceIso);
  if (error || !data) return [];
  return data.map((row) => ({ totalTokens: row.total_tokens, createdAt: row.created_at }));
}
