import type { NextRequest } from "next/server";
import { ar } from "@/messages/ar";
import { notificationsReadSchema } from "@/lib/validation/schemas";
import { authenticateApiUser } from "@/server/auth";
import { firstIssueMessage, jsonError } from "@/server/http";
import {
  countUnread,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/server/repositories/notifications";

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
  const [notifications, unread] = await Promise.all([
    listNotifications(auth.userId),
    countUnread(auth.userId),
  ]);
  return Response.json({
    unread,
    notifications: notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      actionUrl: notification.action_url,
      isRead: notification.is_read,
      createdAt: notification.created_at,
      readAt: notification.read_at,
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

  const parsed = notificationsReadSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "invalid", firstIssueMessage(parsed.error) ?? ar.errors.invalid);
  }

  if (parsed.data.all === true) {
    const ok = await markAllNotificationsRead(auth.userId);
    if (!ok) return jsonError(500, "server", ar.app.notifications.error);
    return Response.json({ ok: true });
  }

  if (parsed.data.id) {
    const ok = await markNotificationRead(auth.userId, parsed.data.id);
    if (!ok) return jsonError(500, "server", ar.app.notifications.error);
    return Response.json({ ok: true });
  }

  return jsonError(400, "invalid", ar.errors.invalid);
}
