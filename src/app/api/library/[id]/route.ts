import { ar } from "@/messages/ar";
import { authenticateApiUser } from "@/server/auth";
import { jsonError } from "@/server/http";
import { deleteSnippet } from "@/server/repositories/snippets";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await authenticateApiUser();
  if (!auth.ok) {
    return jsonError(
      auth.status,
      auth.code,
      auth.code === "forbidden" ? ar.errors.inactive : ar.errors.unauthorized,
    );
  }

  const { id } = await context.params;
  const deleted = await deleteSnippet(auth.userId, id);
  if (!deleted) {
    return jsonError(404, "not_found", ar.errors.notFound);
  }
  return Response.json({ ok: true });
}
