import type { NextRequest } from "next/server";
import { API_KEYS_MAX } from "@/lib/constants";
import { ar } from "@/messages/ar";
import { apiKeyCreateSchema } from "@/lib/validation/schemas";
import { authenticateApiUser } from "@/server/auth";
import { firstIssueMessage, jsonError } from "@/server/http";
import { countActiveApiKeys, insertApiKey, listApiKeys } from "@/server/repositories/api-keys";
import { generateApiKey, isApiKeyUsable } from "@/server/services/api-keys";
import { writeAudit } from "@/server/services/audit";
import type { ApiKey } from "@/types/db";

export const runtime = "nodejs";

function toClientKey(key: ApiKey) {
  const usable = isApiKeyUsable(key);
  return {
    id: key.id,
    name: key.name,
    prefix: key.key_prefix,
    createdAt: key.created_at,
    lastUsedAt: key.last_used_at,
    expiresAt: key.expires_at,
    revokedAt: key.revoked_at,
    status: key.revoked_at ? "revoked" : usable ? "active" : "expired",
  };
}

export async function GET() {
  const auth = await authenticateApiUser();
  if (!auth.ok) {
    return jsonError(
      auth.status,
      auth.code,
      auth.code === "forbidden" ? ar.errors.inactive : ar.errors.unauthorized,
    );
  }
  const keys = await listApiKeys(auth.userId);
  return Response.json({ keys: keys.map(toClientKey) });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateApiUser();
  if (!auth.ok) {
    return jsonError(
      auth.status,
      auth.code,
      auth.code === "forbidden" ? ar.errors.inactive : ar.errors.unauthorized,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "invalid", ar.errors.invalid);
  }

  const parsed = apiKeyCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "invalid", firstIssueMessage(parsed.error) ?? ar.errors.invalid);
  }

  const activeCount = await countActiveApiKeys(auth.userId);
  if (activeCount >= API_KEYS_MAX) {
    return jsonError(400, "invalid", ar.app.apiKeys.limitReached);
  }

  const generated = generateApiKey();
  const inserted = await insertApiKey({
    userId: auth.userId,
    name: parsed.data.name,
    keyPrefix: generated.prefix,
    keyHash: generated.hash,
  });
  if (!inserted) {
    return jsonError(500, "server", ar.app.apiKeys.error);
  }

  await writeAudit({
    userId: auth.userId,
    action: "api_key_created",
    entityType: "api_key",
    entityId: inserted.id,
    request,
    metadata: { prefix: generated.prefix, name: parsed.data.name },
  });

  return Response.json({ key: generated.raw, item: toClientKey(inserted) });
}
