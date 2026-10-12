import { getAdminSupabase } from "@/server/supabase/admin";
import type { Notification } from "@/types/db";

export async function listNotifications(userId: string, limit = 50): Promise<Notification[]> {
  const { data, error } = await getAdminSupabase()
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data;
}

export async function countUnread(userId: string): Promise<number> {
  const { count } = await getAdminSupabase()
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return count ?? 0;
}

export interface InsertNotificationParams {
  userId: string;
  title: string;
  body: string;
  type: "system" | "quota" | "security";
  actionUrl?: string | null;
}

export async function insertNotification(params: InsertNotificationParams): Promise<void> {
  await getAdminSupabase()
    .from("notifications")
    .insert({
      user_id: params.userId,
      title: params.title,
      body: params.body,
      type: params.type,
      action_url: params.actionUrl ?? null,
    });
}

export async function hasNotificationOfTypeBetween(
  userId: string,
  type: "system" | "quota" | "security",
  startIso: string,
  endIso: string,
): Promise<boolean> {
  const { count } = await getAdminSupabase()
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("type", type)
    .gte("created_at", startIso)
    .lt("created_at", endIso);
  return (count ?? 0) > 0;
}

export async function markNotificationRead(userId: string, id: string): Promise<boolean> {
  const { error } = await getAdminSupabase()
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);
  return !error;
}

export async function markAllNotificationsRead(userId: string): Promise<boolean> {
  const { error } = await getAdminSupabase()
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("is_read", false);
  return !error;
}
