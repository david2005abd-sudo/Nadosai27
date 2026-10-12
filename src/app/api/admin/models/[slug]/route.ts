import type { NextRequest } from "next/server";
import { ar } from "@/messages/ar";
import { adminModelUpdateSchema } from "@/lib/validation/schemas";
import { authenticateApiAdmin } from "@/server/auth";
import { firstIssueMessage, jsonError } from "@/server/http";
import { getModelBySlug, setModelEnabled } from "@/server/repositories/models";
import { setDefaultModel } from "@/server/repositories/settings";
import { writeAudit } from "@/server/services/audit";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ slug: string }>;
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

  const { slug } = await context.params;
  const model = await getModelBySlug(slug);
  if (!model) {
    return jsonError(404, "not_found", ar.errors.notFound);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "invalid", ar.errors.invalid);
  }

  const parsed = adminModelUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "invalid", firstIssueMessage(parsed.error) ?? ar.errors.invalid);
  }

  if (parsed.data.isEnabled !== undefined) {
    const ok = await setModelEnabled(slug, parsed.data.isEnabled);
    if (!ok) return jsonError(500, "server", ar.admin.models.error);
    await writeAudit({
      userId: auth.userId,
      action: "model_toggled",
      entityType: "ai_model",
      entityId: slug,
      request,
      metadata: { isEnabled: parsed.data.isEnabled },
    });
  }

  if (parsed.data.setDefault === true) {
    const ok = await setDefaultModel(slug);
    if (!ok) return jsonError(500, "server", ar.admin.models.error);
    await writeAudit({
      userId: auth.userId,
      action: "model_default_changed",
      entityType: "ai_model",
      entityId: slug,
      request,
    });
  }

  return Response.json({ ok: true });
}
