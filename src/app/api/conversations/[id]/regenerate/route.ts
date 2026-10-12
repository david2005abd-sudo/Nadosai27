import type { NextRequest } from "next/server";
import { ar } from "@/messages/ar";
import { authenticateApiUser } from "@/server/auth";
import { jsonError } from "@/server/http";
import { prepareRegenerateTurn, runTurnStream } from "@/server/services/chat";

export const runtime = "nodejs";
export const maxDuration = 60;

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
  const prepared = await prepareRegenerateTurn({
    userId: auth.userId,
    profile: auth.profile,
    conversationId: id,
  });

  if (prepared.kind === "error") {
    return jsonError(prepared.status, prepared.code, prepared.message);
  }
  if (prepared.kind === "replay") {
    return jsonError(500, "server", ar.errors.serverError);
  }

  const run = runTurnStream(prepared, request.signal);
  return run.response;
}
