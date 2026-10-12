import type { NextRequest } from "next/server";
import { ar } from "@/messages/ar";
import { snippetCreateSchema } from "@/lib/validation/schemas";
import { authenticateApiUser } from "@/server/auth";
import { firstIssueMessage, jsonError } from "@/server/http";
import { insertSnippet, listSnippets } from "@/server/repositories/snippets";

export const runtime = "nodejs";

export async function GET() {
  const auth = await authenticateApiUser();
  if (!auth.ok) {
    return jsonError(
      auth.status,
      auth.code,
      auth.code === "forbidden" ? ar.errors.inactive : ar.errors.unauthorized,
    );
  }
  const snippets = await listSnippets(auth.userId);
  return Response.json({
    snippets: snippets.map((snippet) => ({
      id: snippet.id,
      title: snippet.title,
      content: snippet.content,
      sourceMessageId: snippet.source_message_id,
      createdAt: snippet.created_at,
    })),
  });
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

  const parsed = snippetCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "invalid", firstIssueMessage(parsed.error) ?? ar.errors.invalid);
  }

  const snippet = await insertSnippet({
    userId: auth.userId,
    title: parsed.data.title,
    content: parsed.data.content,
    sourceMessageId: parsed.data.sourceMessageId ?? null,
  });
  if (!snippet) {
    return jsonError(500, "server", ar.app.library.error);
  }

  return Response.json({
    snippet: {
      id: snippet.id,
      title: snippet.title,
      content: snippet.content,
      createdAt: snippet.created_at,
    },
  });
}
