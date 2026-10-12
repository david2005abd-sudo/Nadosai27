import type { NextRequest } from "next/server";
import { ar } from "@/messages/ar";
import { accountDeleteSchema } from "@/lib/validation/schemas";
import { authenticateApiUser } from "@/server/auth";
import { firstIssueMessage, jsonError } from "@/server/http";
import { deleteAuthUser } from "@/server/repositories/profiles";
import { writeAudit } from "@/server/services/audit";

export const runtime = "nodejs";

export async function DELETE(request: NextRequest) {
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

  const parsed = accountDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "invalid", firstIssueMessage(parsed.error) ?? ar.errors.invalid);
  }

  await writeAudit({
    userId: auth.userId,
    action: "account_deleted",
    entityType: "profile",
    entityId: auth.userId,
    request,
    metadata: { deletedUserId: auth.userId },
  });

  const deleted = await deleteAuthUser(auth.userId);
  if (!deleted) {
    return jsonError(500, "server", ar.app.settings.deleteError);
  }

  return Response.json({ ok: true });
}
