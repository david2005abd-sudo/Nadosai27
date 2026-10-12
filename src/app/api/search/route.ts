import type { NextRequest } from "next/server";
import { ar } from "@/messages/ar";
import { searchQuerySchema } from "@/lib/validation/schemas";
import { authenticateApiUser } from "@/server/auth";
import { firstIssueMessage, jsonError } from "@/server/http";
import { searchEverything } from "@/server/services/search";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await authenticateApiUser();
  if (!auth.ok) {
    return jsonError(
      auth.status,
      auth.code,
      auth.code === "forbidden" ? ar.errors.inactive : ar.errors.unauthorized,
    );
  }

  const parsed = searchQuerySchema.safeParse({ q: request.nextUrl.searchParams.get("q") ?? "" });
  if (!parsed.success) {
    return jsonError(400, "invalid", firstIssueMessage(parsed.error) ?? ar.errors.invalid);
  }

  const results = await searchEverything(auth.userId, parsed.data.q);
  return Response.json({ results });
}
