"use client";

import { useQuery } from "@tanstack/react-query";
import { ar } from "@/messages/ar";
import { apiFetch } from "@/lib/api-client";
import { formatNumber, formatPercent } from "@/lib/format";
import { cardClass } from "@/components/ui/styles";

interface UsageResponse {
  today: {
    messages: number;
    tokens: number;
    dailyMessageLimit: number;
    dailyTokenLimit: number;
  };
  days: { date: string; label: string; messages: number; tokens: number }[];
  timezone: string;
}

function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <div
      role="img"
      aria-label={`${label}: ${formatNumber(value)}`}
      className="h-2 w-full rounded-full bg-raised"
    >
      <div
        className="h-2 rounded-full bg-accent"
        style={{ width: `${Math.round(ratio * 100)}%` }}
      />
    </div>
  );
}

export default function UsagePage() {
  const query = useQuery({
    queryKey: ["usage"],
    queryFn: () => apiFetch<UsageResponse>("/api/usage"),
  });

  if (query.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8" role="status">
        <p className="text-ink-2">{ar.common.loading}</p>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p role="alert" className="text-sm text-danger">
          {ar.app.usage.error}
        </p>
      </div>
    );
  }

  const { today, days, timezone } = query.data;
  const messagesPercent = (today.messages / today.dailyMessageLimit) * 100;
  const tokensPercent = (today.tokens / today.dailyTokenLimit) * 100;
  const maxTokens = Math.max(today.dailyTokenLimit, ...days.map((day) => day.tokens), 1);
  const maxMessages = Math.max(today.dailyMessageLimit, ...days.map((day) => day.messages), 1);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <h1 className="text-lg font-semibold">{ar.app.usage.title}</h1>
        <p className="mb-6 mt-1 text-sm text-ink-2">{ar.app.usage.desc}</p>

        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <section className={cardClass}>
            <h2 className="mb-2 font-medium">{ar.app.usage.messagesLabel}</h2>
            <p className="text-2xl font-bold">
              {formatNumber(today.messages)}{" "}
              <span className="text-sm font-normal text-ink-2">
                {ar.app.usage.of} {formatNumber(today.dailyMessageLimit)}
              </span>
            </p>
            <div className="mt-3">
              <Bar
                value={today.messages}
                max={today.dailyMessageLimit}
                label={ar.app.usage.messagesLabel}
              />
            </div>
            <p className="mt-2 text-xs text-ink-2">
              {formatPercent(messagesPercent)} ·{" "}
              {formatNumber(today.dailyMessageLimit - today.messages)} {ar.app.usage.messages}
            </p>
          </section>

          <section className={cardClass}>
            <h2 className="mb-2 font-medium">{ar.app.usage.tokensLabel}</h2>
            <p className="text-2xl font-bold">
              {formatNumber(today.tokens)}{" "}
              <span className="text-sm font-normal text-ink-2">
                {ar.app.usage.of} {formatNumber(today.dailyTokenLimit)}
              </span>
            </p>
            <div className="mt-3">
              <Bar
                value={today.tokens}
                max={today.dailyTokenLimit}
                label={ar.app.usage.tokensLabel}
              />
            </div>
            <p className="mt-2 text-xs text-ink-2">
              {formatPercent(tokensPercent)} · {formatNumber(today.dailyTokenLimit - today.tokens)}{" "}
              {ar.app.usage.tokens}
            </p>
          </section>
        </div>

        <section aria-label={ar.app.usage.last7} className={cardClass}>
          <h2 className="mb-4 font-medium">{ar.app.usage.last7}</h2>
          <ul className="flex flex-col gap-3">
            {days.map((day) => (
              <li key={day.date} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{day.label}</span>
                  <span className="text-ink-2">
                    {formatNumber(day.messages)} {ar.app.usage.messages} ·{" "}
                    {formatNumber(day.tokens)} {ar.app.usage.tokens}
                  </span>
                </div>
                <Bar
                  value={day.messages}
                  max={maxMessages}
                  label={`${day.label} ${ar.app.usage.messages}`}
                />
                <Bar
                  value={day.tokens}
                  max={maxTokens}
                  label={`${day.label} ${ar.app.usage.tokens}`}
                />
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-ink-2">
            {ar.app.usage.resetNote} {timezone}
          </p>
        </section>
      </div>
    </div>
  );
}
