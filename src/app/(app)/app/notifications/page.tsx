"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ar } from "@/messages/ar";
import { apiFetch } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import { btnGhost } from "@/components/ui/styles";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: "system" | "quota" | "security";
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

function typeLabel(type: NotificationItem["type"]): string {
  if (type === "quota") return ar.app.notifications.typeQuota;
  if (type === "security") return ar.app.notifications.typeSecurity;
  return ar.app.notifications.typeSystem;
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      apiFetch<{ unread: number; notifications: NotificationItem[] }>("/api/notifications"),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    void queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
  };

  const readAllMutation = useMutation({
    mutationFn: () =>
      apiFetch("/api/notifications", { method: "POST", body: JSON.stringify({ all: true }) }),
    onSuccess: invalidate,
  });

  const readOneMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch("/api/notifications", { method: "POST", body: JSON.stringify({ id }) }),
    onSuccess: invalidate,
    onError: () => {
      void 0;
    },
  });

  const notifications = query.data?.notifications ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold">{ar.app.notifications.title}</h1>
          {notifications.some((notification) => !notification.isRead) ? (
            <button
              type="button"
              className={`${btnGhost} min-h-9`}
              onClick={() => readAllMutation.mutate()}
              disabled={readAllMutation.isPending}
            >
              {ar.app.notifications.markAllRead}
            </button>
          ) : null}
        </div>

        {query.isLoading ? <p className="text-sm text-ink-2">{ar.common.loading}</p> : null}
        {!query.isLoading && notifications.length === 0 ? (
          <p className="text-sm text-ink-2">{ar.app.notifications.empty}</p>
        ) : null}

        <ul className="flex flex-col gap-3">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={cn(
                "rounded-xl border p-4",
                notification.isRead ? "border-edge bg-surface" : "border-accent/40 bg-raised",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-ink-2">
                    {typeLabel(notification.type)} · {formatDateTime(notification.createdAt)}
                  </p>
                  <h2 className="mt-1 font-medium">{notification.title}</h2>
                  <p className="mt-1 text-sm text-ink-2">{notification.body}</p>
                  {notification.actionUrl ? (
                    <Link
                      href={notification.actionUrl}
                      className="mt-2 inline-block text-sm text-link hover:underline"
                    >
                      {ar.app.notifications.open}
                    </Link>
                  ) : null}
                </div>
                {!notification.isRead ? (
                  <button
                    type="button"
                    className="shrink-0 rounded-lg border border-edge px-3 py-2 text-xs hover:bg-raised"
                    onClick={() => readOneMutation.mutate(notification.id)}
                  >
                    {ar.app.notifications.markRead}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
