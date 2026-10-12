"use client";

import { useState } from "react";
import { ar } from "@/messages/ar";
import { apiFetch, ApiError } from "@/lib/api-client";
import { btnPrimary, cardClass, inputClass, labelClass } from "@/components/ui/styles";

export function AdminLimitsForm({
  initial,
  defaultModel,
}: {
  initial: { dailyMessageLimit: number; dailyTokenLimit: number };
  defaultModel: string;
}) {
  const [dailyMessageLimit, setDailyMessageLimit] = useState(String(initial.dailyMessageLimit));
  const [dailyTokenLimit, setDailyTokenLimit] = useState(String(initial.dailyTokenLimit));
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setNotice(null);
    setError(null);
    const messages = Number(dailyMessageLimit);
    const tokens = Number(dailyTokenLimit);
    if (!Number.isInteger(messages) || messages <= 0 || !Number.isInteger(tokens) || tokens <= 0) {
      setError(ar.admin.overview.limitInvalid);
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ dailyMessageLimit: messages, dailyTokenLimit: tokens }),
      });
      setNotice(ar.admin.overview.limitsSaved);
    } catch (saveError) {
      setError(saveError instanceof ApiError ? saveError.message : ar.admin.overview.limitsError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={cardClass} aria-label={ar.admin.overview.quotaTitle}>
      <h2 className="mb-4 text-lg font-semibold">{ar.admin.overview.quotaTitle}</h2>
      <form onSubmit={save} className="flex flex-col gap-3" noValidate>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label htmlFor="admin-message-limit" className={labelClass}>
              {ar.admin.overview.dailyMessageLimit}
            </label>
            <input
              id="admin-message-limit"
              type="number"
              min={1}
              value={dailyMessageLimit}
              onChange={(event) => setDailyMessageLimit(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="admin-token-limit" className={labelClass}>
              {ar.admin.overview.dailyTokenLimit}
            </label>
            <input
              id="admin-token-limit"
              type="number"
              min={1}
              value={dailyTokenLimit}
              onChange={(event) => setDailyTokenLimit(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <p className="text-sm text-ink-2">
          {ar.admin.overview.defaultModel}: <span dir="ltr">{defaultModel}</span>
        </p>
        {notice ? <p className="text-sm text-success">{notice}</p> : null}
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={saving} className={`${btnPrimary} self-start`}>
          {saving ? ar.common.saving : ar.admin.overview.saveLimits}
        </button>
      </form>
    </section>
  );
}
