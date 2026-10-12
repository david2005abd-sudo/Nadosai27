import { ar } from "@/messages/ar";
import { requireAdmin } from "@/server/auth";
import { listUsersForAdmin } from "@/server/repositories/profiles";
import { listRecentUsageForAdmin, listUsageSinceAll } from "@/server/repositories/usage";
import { getDayRangeUtc, localDateKey } from "@/lib/time/day";
import { formatDateTime, formatDuration, formatNumber } from "@/lib/format";
import { cardClass } from "@/components/ui/styles";

export default async function AdminUsagePage() {
  await requireAdmin();

  const { start } = getDayRangeUtc("Asia/Baghdad");
  const eightDaysAgo = new Date(start);
  eightDaysAgo.setUTCDate(eightDaysAgo.getUTCDate() - 8);

  const [recent, weekRows, users] = await Promise.all([
    listRecentUsageForAdmin(100),
    listUsageSinceAll(eightDaysAgo.toISOString()),
    listUsersForAdmin(500),
  ]);

  const emailById = new Map(users.map((user) => [user.id, user.email]));

  const byDay = new Map<string, { tokens: number; requests: number; errors: number }>();
  for (let offset = 7; offset >= 1; offset -= 1) {
    const dayStart = new Date(start);
    dayStart.setUTCDate(dayStart.getUTCDate() - offset);
    byDay.set(localDateKey(dayStart, "Asia/Baghdad"), { tokens: 0, requests: 0, errors: 0 });
  }
  for (const row of weekRows) {
    const key = localDateKey(new Date(row.createdAt), "Asia/Baghdad");
    const bucket = byDay.get(key);
    if (bucket) {
      bucket.tokens += row.totalTokens;
      bucket.requests += 1;
    }
  }
  for (const row of recent) {
    if (row.request_status === "error") {
      const key = localDateKey(new Date(row.created_at), "Asia/Baghdad");
      const bucket = byDay.get(key);
      if (bucket) bucket.errors += 1;
    }
  }

  const statusLabel = (status: string): string => {
    if (status === "ok") return ar.admin.usage.statusOk;
    if (status === "error") return ar.admin.usage.statusError;
    if (status === "aborted") return ar.admin.usage.statusAborted;
    return ar.admin.usage.statusLimited;
  };

  const maxTokens = Math.max(1, ...Array.from(byDay.values()).map((bucket) => bucket.tokens));

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">{ar.admin.usage.title}</h1>

      <section className={`${cardClass} mb-6`} aria-label={ar.admin.usage.last7}>
        <h2 className="mb-3 font-medium">{ar.admin.usage.last7}</h2>
        <ul className="flex flex-col gap-2">
          {Array.from(byDay.entries()).map(([date, bucket]) => (
            <li key={date} className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span>{date}</span>
                <span className="text-ink-2">
                  {formatNumber(bucket.requests)} {ar.admin.usage.requests} ·{" "}
                  {formatNumber(bucket.errors)} {ar.admin.usage.errors} ·{" "}
                  {formatNumber(bucket.tokens)} {ar.admin.usage.totalTokens}
                </span>
              </div>
              <div
                role="img"
                aria-label={`${date}: ${formatNumber(bucket.tokens)}`}
                className="h-2 w-full rounded-full bg-raised"
              >
                <div
                  className="h-2 rounded-full bg-accent"
                  style={{ width: `${Math.round((bucket.tokens / maxTokens) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label={ar.admin.usage.recent}>
        <h2 className="mb-3 font-medium">{ar.admin.usage.recent}</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-ink-2">{ar.admin.usage.empty}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-edge">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-raised">
                <tr>
                  <th className="px-3 py-2 text-start">{ar.admin.usage.user}</th>
                  <th className="px-3 py-2 text-start">{ar.admin.usage.status}</th>
                  <th className="px-3 py-2 text-start">{ar.admin.usage.totalTokens}</th>
                  <th className="px-3 py-2 text-start">{ar.admin.usage.duration}</th>
                  <th className="px-3 py-2 text-start">{ar.admin.usage.when}</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((row) => (
                  <tr key={row.id} className="border-t border-edge">
                    <td className="px-3 py-2" dir="ltr">
                      {emailById.get(row.user_id) ?? "—"}
                    </td>
                    <td className="px-3 py-2">{statusLabel(row.request_status)}</td>
                    <td className="px-3 py-2">{formatNumber(row.total_tokens)}</td>
                    <td className="px-3 py-2">
                      {row.request_duration_ms ? formatDuration(row.request_duration_ms) : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-ink-2">
                      {formatDateTime(row.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
