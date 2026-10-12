import { getAdminSupabase } from "@/server/supabase/admin";
import type { ApiKey } from "@/types/db";

export async function listApiKeys(userId: string): Promise<ApiKey[]> {
  const { data, error } = await getAdminSupabase()
    .from("api_keys")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data;
}

export async function countActiveApiKeys(userId: string): Promise<number> {
  const { count } = await getAdminSupabase()
    .from("api_keys")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("revoked_at", null);
  return count ?? 0;
}

export interface InsertApiKeyParams {
  userId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
}

export async function insertApiKey(params: InsertApiKeyParams): Promise<ApiKey | null> {
  const { data, error } = await getAdminSupabase()
    .from("api_keys")
    .insert({
      user_id: params.userId,
      name: params.name,
      key_prefix: params.keyPrefix,
      key_hash: params.keyHash,
    })
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function findApiKeyByHash(keyHash: string): Promise<ApiKey | null> {
  const { data, error } = await getAdminSupabase()
    .from("api_keys")
    .select("*")
    .eq("key_hash", keyHash)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function revokeApiKey(userId: string, id: string): Promise<boolean> {
  const { error } = await getAdminSupabase()
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .is("revoked_at", null);
  return !error;
}

export async function touchApiKeyLastUsed(id: string): Promise<void> {
  await getAdminSupabase()
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", id);
}
