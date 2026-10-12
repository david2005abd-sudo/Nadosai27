import type { ZodError } from "zod";

export function jsonError(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status });
}

export function firstIssueMessage(error: ZodError): string | null {
  const issue = error.issues[0];
  return issue ? issue.message : null;
}

export const STREAM_HEADERS: Record<string, string> = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-store, no-transform",
  "X-Accel-Buffering": "no",
};
