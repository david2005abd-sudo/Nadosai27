import type { NextRequest } from "next/server";
import { ar } from "@/messages/ar";
import { feedbackSchema } from "@/lib/validation/schemas";
import { authenticateApiUser } from "@/server/auth";
import { firstIssueMessage, jsonError } from "@/server/http";
import { deleteVote, upsertVote } from "@/server/repositories/message-feedback";
import { getMessageForUser } from "@/server/repositories/messages";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await authenticateApiUser();
  if (!auth.ok) {
    return jsonError(
      auth.status,
      auth.code,
      auth.code === "forbidden" ? ar.errors.inactive : ar.errors.unauthorized,
    );
  }

  const { id } = await context.params;
  const message = await getMessageForUser(id, auth.userId);
  if (!message || message.role !== "assistant") {
    return jsonError(404, "not_found", ar.errors.notFound);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "invalid", ar.errors.invalid);
  }

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "invalid", firstIssueMessage(parsed.error) ?? ar.errors.invalid);
  }

  const vote = parsed.data.vote;
  if (vote === 0) {
    const removed = await deleteVote(id, auth.userId);
    if (!removed) return jsonError(500, "server", ar.errors.serverError);
    return Response.json({ vote: null });
  }

  const saved = await upsertVote(id, auth.userId, vote);
  if (!saved) return jsonError(500, "server", ar.errors.serverError);
  return Response.json({ vote });
}
