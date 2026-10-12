import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/db";

let adminClient: SupabaseClient<Database> | null = null;

export function getAdminSupabase(): SupabaseClient<Database> {
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  }
  adminClient = createClient<Database>(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return adminClient;
}
