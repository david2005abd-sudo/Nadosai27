import { getAdminSupabase } from "@/server/supabase/admin";
import type { SystemSettings } from "@/types/db";

export async function getSystemSettings(): Promise<SystemSettings | null> {
  const { data, error } = await getAdminSupabase()
    .from("system_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function updateSystemLimits(
  dailyMessageLimit: number,
  dailyTokenLimit: number,
): Promise<boolean> {
  const { error } = await getAdminSupabase()
    .from("system_settings")
    .update({ daily_message_limit: dailyMessageLimit, daily_token_limit: dailyTokenLimit })
    .eq("id", 1);
  return !error;
}

export async function setDefaultModel(slug: string): Promise<boolean> {
  const { error } = await getAdminSupabase()
    .from("system_settings")
    .update({ default_model: slug })
    .eq("id", 1);
  return !error;
}
