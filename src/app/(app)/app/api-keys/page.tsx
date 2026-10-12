"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Plus, Trash2 } from "lucide-react";
import { ar } from "@/messages/ar";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import { Dialog } from "@/components/ui/Dialog";
import { btnGhost, btnPrimary, cardClass, inputClass, labelClass } from "@/components/ui/styles";

interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  status: "active" | "revoked" | "expired";
}

const EXAMPLE_CURL = `curl -X POST "https://your-domain/api/v1/chat" \\
  -H "Authorization: Bearer nados_..." \\
  -H "Content-Type: application/json" \\
  -d '{"content": "مرحبًا"}'`;

function statusLabel(item: ApiKeyItem): string {
  if (item.status === "revoked") return ar.app.apiKeys.statusRevoked;
  if (item.status === "expired") return ar.app.apiKeys.statusExpired;
  return ar.app.apiKeys.statusActive;
}

export default function ApiKeysPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<ApiKeyItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["api-keys"],
    queryFn: () => apiFetch<{ keys: ApiKeyItem[] }>("/api/api-keys"),
  });

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["api-keys"] });

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ key: string }>("/api/api-keys", {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      }),
    onSuccess: (data) => {
      setCreateOpen(false);
      setName("");
      setFormError(null);
      setCopied(false);
      setCreatedKey(data.key);
      invalidate();
    },
    onError: (error) => {
      setFormError(error instanceof ApiError ? error.message : ar.app.apiKeys.error);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/api-keys/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      setRevoking(null);
      invalidate();
    },
    onError: (error) => {
      setActionError(error instanceof ApiError ? error.message : ar.app.apiKeys.error);
    },
  });

  const keys = query.data?.keys ?? [];
  const activeCount = keys.filter((key) => key.status === "active").length;

  async function copyKey() {
    if (!createdKey) return;
    try {
      await navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setActionError(ar.app.apiKeys.error);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold">{ar.app.apiKeys.title}</h1>
          <button
            type="button"
            className={`${btnPrimary} min-h-9`}
            onClick={() => {
              setFormError(null);
              setCreateOpen(true);
            }}
            disabled={activeCount >= 5}
          >
            <Plus size={16} aria-hidden />
            {ar.app.apiKeys.create}
          </button>
        </div>
        <p className="mb-6 text-sm text-ink-2">{ar.app.apiKeys.desc}</p>

        {actionError ? (
          <p role="alert" className="mb-4 text-sm text-danger">
            {actionError}
          </p>
        ) : null}

        <section
          aria-label={ar.app.apiKeys.exampleTitle}
          className="mb-6 rounded-xl border border-edge bg-surface p-4"
        >
          <h2 className="mb-2 font-medium">{ar.app.apiKeys.exampleTitle}</h2>
          <pre
            dir="ltr"
            className="overflow-x-auto rounded-lg bg-raised p-3 text-left font-mono text-xs"
          >
            {EXAMPLE_CURL}
          </pre>
        </section>

        {query.isLoading ? <p className="text-sm text-ink-2">{ar.common.loading}</p> : null}
        {!query.isLoading && keys.length === 0 ? (
          <p className="text-sm text-ink-2">{ar.app.apiKeys.empty}</p>
        ) : null}

        <ul className="flex flex-col gap-3">
          {keys.map((key) => (
            <li key={key.id} className={cardClass}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">
                    {key.name}{" "}
                    <span
                      className={
                        key.status === "active"
                          ? "ms-2 rounded-full bg-raised px-2 py-0.5 text-xs text-success"
                          : "ms-2 rounded-full bg-raised px-2 py-0.5 text-xs text-danger"
                      }
                    >
                      {statusLabel(key)}
                    </span>
                  </p>
                  <p dir="ltr" className="mt-1 text-start font-mono text-sm text-ink-2">
                    {key.prefix}…
                  </p>
                  <p className="mt-1 text-xs text-ink-2">
                    {ar.app.apiKeys.created}: {formatDateTime(key.createdAt)} ·{" "}
                    {ar.app.apiKeys.usedAt}:{" "}
                    {key.lastUsedAt ? formatDateTime(key.lastUsedAt) : ar.app.apiKeys.never}
                  </p>
                </div>
                {key.status === "active" ? (
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-edge text-danger hover:bg-raised"
                    onClick={() => setRevoking(key)}
                    aria-label={ar.app.apiKeys.revoke}
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Dialog open={createOpen} title={ar.app.apiKeys.create} onClose={() => setCreateOpen(false)}>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) {
              setFormError(ar.app.apiKeys.nameRequired);
              return;
            }
            createMutation.mutate();
          }}
          noValidate
        >
          <div>
            <label htmlFor="key-name" className={labelClass}>
              {ar.app.apiKeys.name}
            </label>
            <input
              id="key-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={ar.app.apiKeys.namePlaceholder}
              maxLength={60}
              className={inputClass}
            />
            {formError ? (
              <p role="alert" className="mt-1 text-sm text-danger">
                {formError}
              </p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={createMutation.isPending} className={btnPrimary}>
              {createMutation.isPending ? ar.common.saving : ar.common.confirm}
            </button>
            <button type="button" className={btnGhost} onClick={() => setCreateOpen(false)}>
              {ar.common.cancel}
            </button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={createdKey !== null}
        title={ar.app.apiKeys.createdTitle}
        onClose={() => setCreatedKey(null)}
      >
        <p className="mb-3 text-sm text-ink-2">{ar.app.apiKeys.createdDesc}</p>
        <p
          dir="ltr"
          className="mb-3 break-all rounded-lg border border-edge bg-raised p-3 text-start font-mono text-sm"
        >
          {createdKey}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => void copyKey()} className={btnPrimary}>
            {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
            {copied ? ar.app.apiKeys.keyCopied : ar.app.apiKeys.copyKey}
          </button>
          <button type="button" className={btnGhost} onClick={() => setCreatedKey(null)}>
            {ar.app.apiKeys.done}
          </button>
        </div>
      </Dialog>

      <Dialog
        open={revoking !== null}
        title={ar.app.apiKeys.revokeTitle}
        onClose={() => setRevoking(null)}
      >
        <p className="mb-4 text-sm text-ink-2">{ar.app.apiKeys.revokeBody}</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="min-h-11 rounded-lg bg-danger px-4 font-medium text-white"
            disabled={revokeMutation.isPending}
            onClick={() => {
              if (revoking) revokeMutation.mutate(revoking.id);
            }}
          >
            {ar.app.apiKeys.revoke}
          </button>
          <button type="button" className={btnGhost} onClick={() => setRevoking(null)}>
            {ar.common.cancel}
          </button>
        </div>
      </Dialog>
    </div>
  );
}
