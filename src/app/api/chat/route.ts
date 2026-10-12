import type { NextRequest } from "next/server";
import { chatRequestSchema } from "@/lib/validation/schemas";
import { ar } from "@/messages/ar";
import { authenticateApiUser } from "@/server/auth";
import { firstIssueMessage, jsonError, STREAM_HEADERS } from "@/server/http";
import { prepareChatTurn, runTurnStream } from "@/server/services/chat";

export const runtime = "nodejs";
export const maxDuration = 60;

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

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "invalid", firstIssueMessage(parsed.error) ?? ar.errors.invalid);
  }

  const prepared = await prepareChatTurn({
    userId: auth.userId,
    profile: auth.profile,
    conversationId: parsed.data.conversationId,
    clientMessageId: parsed.data.clientMessageId,
    content: parsed.data.content,
  });

  if (prepared.kind === "error") {
    return jsonError(prepared.status, prepared.code, prepared.message);
  }
  if (prepared.kind === "replay") {
    return new Response(prepared.content, { headers: STREAM_HEADERS });
  }

  const run = runTurnStream(prepared, request.signal);
  return run.response;
}
