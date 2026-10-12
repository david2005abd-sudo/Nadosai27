import type { NextRequest } from "next/server";
import { ar } from "@/messages/ar";
import { adminUserUpdateSchema } from "@/lib/validation/schemas";
import { authenticateApiAdmin } from "@/server/auth";
import { firstIssueMessage, jsonError } from "@/server/http";
import { getProfileById, setUserActive, setUserRole } from "@/server/repositories/profiles";
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
  const target = await getProfileById(id);
  if (!target) {
    return jsonError(404, "not_found", ar.errors.notFound);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "invalid", ar.errors.invalid);
  }

  const parsed = adminUserUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "invalid", firstIssueMessage(parsed.error) ?? ar.errors.invalid);
  }

  if (parsed.data.isActive !== undefined) {
    const ok = await setUserActive(id, parsed.data.isActive);
    if (!ok) return jsonError(500, "server", ar.admin.users.error);
    await writeAudit({
      userId: auth.userId,
      action: parsed.data.isActive ? "user_activated" : "user_deactivated",
      entityType: "profile",
      entityId: id,
      request,
    });
  }

  if (parsed.data.role !== undefined) {
    const ok = await setUserRole(id, parsed.data.role);
    if (!ok) return jsonError(500, "server", ar.admin.users.error);
    await writeAudit({
      userId: auth.userId,
      action: "role_changed",
      entityType: "profile",
      entityId: id,
      request,
      metadata: { role: parsed.data.role },
    });
  }

  return Response.json({ ok: true });
}
