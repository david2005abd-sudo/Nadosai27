"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ar } from "@/messages/ar";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatNumber } from "@/lib/format";
import { btnPrimary, cardClass } from "@/components/ui/styles";
import { cn } from "@/lib/utils";

export interface AdminModelRow {
  slug: string;
  name: string;
  provider: string;
  contextWindow: number | null;
  isEnabled: boolean;
  isDefault: boolean;
}

export function AdminModelsList({ models }: { models: AdminModelRow[] }) {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ slug, body }: { slug: string; body: Record<string, unknown> }) =>
      apiFetch(`/api/admin/models/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries();
    },
    onError: (mutationError) => {
      setError(mutationError instanceof ApiError ? mutationError.message : ar.admin.models.error);
    },
  });

  if (models.length === 0) {
    return <p className="text-sm text-ink-2">{ar.admin.models.empty}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      {models.map((model) => (
        <div key={model.slug} className={cn(cardClass, "flex flex-wrap items-center gap-3")}>
          <div className="min-w-0 flex-1">
            <p className="font-medium">
              {model.name}
              {model.isDefault ? (
                <span className="ms-2 rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">
                  {ar.admin.models.defaultBadge}
                </span>
              ) : null}
            </p>
            <p dir="ltr" className="mt-1 text-start text-xs text-ink-2">
              {model.slug} · {model.provider}
              {model.contextWindow ? ` · ${formatNumber(model.contextWindow)}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className={cn(
                "min-h-9 rounded-lg border px-3 text-xs",
                model.isEnabled ? "border-success text-success" : "border-edge text-ink-2",
              )}
              onClick={() =>
                mutation.mutate({ slug: model.slug, body: { isEnabled: !model.isEnabled } })
              }
            >
              {model.isEnabled ? ar.common.enabled : ar.common.disabled}
            </button>
            {!model.isDefault ? (
              <button
                type="button"
                className={`${btnPrimary} min-h-9`}
                onClick={() => mutation.mutate({ slug: model.slug, body: { setDefault: true } })}
              >
                {ar.admin.models.setDefault}
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
