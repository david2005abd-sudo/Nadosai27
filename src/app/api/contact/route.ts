import type { NextRequest } from "next/server";
import { ar } from "@/messages/ar";
import { contactSchema } from "@/lib/validation/schemas";
import { readClaims } from "@/server/auth";
import { firstIssueMessage, jsonError } from "@/server/http";
import { insertContactMessage } from "@/server/repositories/contact";
import { getClientIp, hashIp } from "@/server/services/audit";
import { consumeContactRateLimit } from "@/server/services/rate-limit";

export const runtime = "nodejs";

async function sendContactEmail(params: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim();
  if (!apiKey || !to) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Nados AI <onboarding@resend.dev>",
        to: [to],
        reply_to: params.email,
        subject: `رسالة تواصل: ${params.subject}`,
        text: `الاسم: ${params.name}\nالبريد: ${params.email}\n\n${params.message}`,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "invalid", ar.errors.invalid);
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "invalid", firstIssueMessage(parsed.error) ?? ar.errors.invalid);
  }

  if (parsed.data.company && parsed.data.company.trim().length > 0) {
    return Response.json({ message: ar.contact.successSaved });
  }

  const ip = getClientIp(request);
  const ipHash = hashIp(ip ?? "unknown");
  const allowed = await consumeContactRateLimit(ipHash);
  if (!allowed) {
    return jsonError(429, "rate_limit", ar.contact.rateLimited);
  }

  const claims = await readClaims();
  const saved = await insertContactMessage({
    userId: claims?.userId ?? null,
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });
  if (!saved) {
    return jsonError(500, "server", ar.contact.error);
  }

  const emailed = await sendContactEmail({
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });

  return Response.json({ message: emailed ? ar.contact.successEmailed : ar.contact.successSaved });
}
