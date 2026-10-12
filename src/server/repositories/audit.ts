import { getAdminSupabase } from "@/server/supabase/admin";
import type { AuditLog, Json } from "@/types/db";

export interface InsertAuditParams {
  userId: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  ipHash?: string | null;
  userAgent?: string | null;
  metadata?: Json;
}

export async function insertAuditLog(params: InsertAuditParams): Promise<void> {
  await getAdminSupabase()
    .from("audit_logs")
    .insert({
      user_id: params.userId,
      action: params.action,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
      ip_hash: params.ipHash ?? null,
      user_agent: params.userAgent ?? null,
      metadata: params.metadata ?? {},
    });
}

export async function listAuditLogs(limit = 100): Promise<AuditLog[]> {
  const { data, error } = await getAdminSupabase()
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data;
}

export async function findAuditLogsForUsers(userIds: string[]): Promise<AuditLog[]> {
  if (userIds.length === 0) return [];
  const { data, error } = await getAdminSupabase()
    .from("audit_logs")
    .select("*")
    .in("user_id", userIds)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error || !data) return [];
  return data;
}
