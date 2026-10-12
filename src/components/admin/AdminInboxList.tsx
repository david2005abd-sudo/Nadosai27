"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ar } from "@/messages/ar";
import { apiFetch, ApiError } from "@/lib/api-client";
import { btnGhost, cardClass } from "@/components/ui/styles";

export interface AdminInboxRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  body: string;
  status: "new" | "read" | "closed";
  whenLabel: string;
}

function statusLabel(status: AdminInboxRow["status"]): string {
  if (status === "read") return ar.admin.inbox.read;
  if (status === "closed") return ar.admin.inbox.closed;
  return ar.admin.inbox.new;
}

export function AdminInboxList({ messages }: { messages: AdminInboxRow[] }) {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/api/admin/inbox/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries();
    },
    onError: (mutationError) => {
      setError(mutationError instanceof ApiError ? mutationError.message : ar.admin.inbox.error);
    },
  });

  if (messages.length === 0) {
    return <p className="text-sm text-ink-2">{ar.admin.inbox.empty}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      {messages.map((message) => (
        <article key={message.id} className={cardClass}>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium">{message.subject}</p>
              <p className="text-xs text-ink-2">
                {ar.admin.inbox.from}: {message.name} <span dir="ltr">({message.email})</span> ·{" "}
                {message.whenLabel}
              </p>
            </div>
            <span className="rounded-full bg-raised px-2 py-0.5 text-xs text-ink-2">
              {statusLabel(message.status)}
            </span>
          </div>
          <p className="whitespace-pre-wrap break-words text-sm text-ink-2">{message.body}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {message.status !== "read" ? (
              <button
                type="button"
                className={`${btnGhost} min-h-9 px-3 text-xs`}
                onClick={() => mutation.mutate({ id: message.id, status: "read" })}
              >
                {ar.admin.inbox.markRead}
              </button>
            ) : null}
            {message.status !== "closed" ? (
              <button
                type="button"
                className={`${btnGhost} min-h-9 px-3 text-xs`}
                onClick={() => mutation.mutate({ id: message.id, status: "closed" })}
              >
                {ar.admin.inbox.close}
              </button>
            ) : (
              <button
                type="button"
                className={`${btnGhost} min-h-9 px-3 text-xs`}
                onClick={() => mutation.mutate({ id: message.id, status: "new" })}
              >
                {ar.admin.inbox.reopen}
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
