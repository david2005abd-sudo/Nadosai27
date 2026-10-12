import type { NextRequest } from "next/server";
import { ar } from "@/messages/ar";
import { adminSettingsUpdateSchema } from "@/lib/validation/schemas";
import { authenticateApiAdmin } from "@/server/auth";
import { firstIssueMessage, jsonError } from "@/server/http";
import { updateSystemLimits } from "@/server/repositories/settings";
import { writeAudit } from "@/server/services/audit";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  const auth = await authenticateApiAdmin();
  if (!auth.ok) {
    return jsonError(
      auth.status,
      auth.code,
      auth.code === "forbidden" ? ar.errors.forbidden : ar.errors.unauthorized,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "invalid", ar.errors.invalid);
  }

  const parsed = adminSettingsUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      400,
      "invalid",
      firstIssueMessage(parsed.error) ?? ar.admin.overview.limitInvalid,
    );
  }

  const ok = await updateSystemLimits(parsed.data.dailyMessageLimit, parsed.data.dailyTokenLimit);
  if (!ok) {
    return jsonError(500, "server", ar.admin.overview.limitsError);
  }

  await writeAudit({
    userId: auth.userId,
    action: "settings_updated",
    entityType: "system_settings",
    entityId: "1",
    request,
    metadata: {
      dailyMessageLimit: parsed.data.dailyMessageLimit,
      dailyTokenLimit: parsed.data.dailyTokenLimit,
    },
  });

  return Response.json({ ok: true });
}
