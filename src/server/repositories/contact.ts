import { getAdminSupabase } from "@/server/supabase/admin";
import type { ContactMessage } from "@/types/db";

export interface InsertContactParams {
  userId: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function insertContactMessage(params: InsertContactParams): Promise<boolean> {
  const { error } = await getAdminSupabase().from("contact_messages").insert({
    user_id: params.userId,
    name: params.name,
    email: params.email,
    subject: params.subject,
    message: params.message,
  });
  return !error;
}

export async function listContactMessages(limit = 100): Promise<ContactMessage[]> {
  const { data, error } = await getAdminSupabase()
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data;
}

export async function updateContactStatus(id: string, status: string): Promise<boolean> {
  const { error } = await getAdminSupabase()
    .from("contact_messages")
    .update({ status })
    .eq("id", id);
  return !error;
}
