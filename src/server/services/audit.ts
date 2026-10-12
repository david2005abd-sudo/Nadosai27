import { createHash } from "node:crypto";
import { USER_AGENT_MAX } from "@/lib/constants";
import { insertAuditLog } from "@/server/repositories/audit";
import type { Json } from "@/types/db";

export function hashIp(ip: string, pepper: string = process.env.AUDIT_IP_PEPPER ?? ""): string {
  return createHash("sha256").update(`${pepper}:${ip}`).digest("hex");
}

export function truncateUserAgent(userAgent: string | null): string | null {
  if (!userAgent) return null;
  return Array.from(userAgent).slice(0, USER_AGENT_MAX).join("");
}

export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0];
    return first ? first.trim() : null;
  }
  return request.headers.get("x-real-ip");
}

export interface AuditParams {
  userId: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  request?: Request;
  metadata?: Json;
}

export async function writeAudit(params: AuditParams): Promise<void> {
  const ip = params.request ? getClientIp(params.request) : null;
  const userAgent = params.request
    ? truncateUserAgent(params.request.headers.get("user-agent"))
    : null;
  await insertAuditLog({
    userId: params.userId,
    action: params.action,
    entityType: params.entityType ?? null,
    entityId: params.entityId ?? null,
    ipHash: ip ? hashIp(ip) : null,
    userAgent,
    metadata: params.metadata ?? {},
  });
}
