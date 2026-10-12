import type { NextRequest } from "next/server";
import { ar } from "@/messages/ar";
import { adminInboxUpdateSchema } from "@/lib/validation/schemas";
import { authenticateApiAdmin } from "@/server/auth";
import { firstIssueMessage, jsonError } from "@/server/http";
import { updateContactStatus } from "@/server/repositories/contact";
import { writeAudit } from "@/server/services/audit";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await authenticateApiAdmin();
  if (!auth.ok) {
    return jsonError(
      auth.status,
      auth.code,
      auth.code === "forbidden" ? ar.errors.forbidden : ar.errors.unauthorized,
    );
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "invalid", ar.errors.invalid);
  }

  const parsed = adminInboxUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "invalid", firstIssueMessage(parsed.error) ?? ar.errors.invalid);
  }

  const ok = await updateContactStatus(id, parsed.data.status);
  if (!ok) {
    return jsonError(500, "server", ar.admin.inbox.error);
  }

  await writeAudit({
    userId: auth.userId,
    action: "contact_status_changed",
    entityType: "contact_message",
    entityId: id,
    request,
    metadata: { status: parsed.data.status },
  });

  return Response.json({ ok: true });
}
