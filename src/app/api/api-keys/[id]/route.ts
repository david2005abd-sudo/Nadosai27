import type { NextRequest } from "next/server";
import { ar } from "@/messages/ar";
import { authenticateApiUser } from "@/server/auth";
import { jsonError } from "@/server/http";
import { revokeApiKey } from "@/server/repositories/api-keys";
import { writeAudit } from "@/server/services/audit";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await authenticateApiUser();
  if (!auth.ok) {
    return jsonError(
      auth.status,
      auth.code,
      auth.code === "forbidden" ? ar.errors.inactive : ar.errors.unauthorized,
    );
  }

  const { id } = await context.params;
  const revoked = await revokeApiKey(auth.userId, id);
  if (!revoked) {
    return jsonError(404, "not_found", ar.errors.notFound);
  }

  await writeAudit({
    userId: auth.userId,
    action: "api_key_revoked",
    entityType: "api_key",
    entityId: id,
    request,
  });

  return Response.json({ ok: true });
}
