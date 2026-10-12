import { ar } from "@/messages/ar";
import { requireAdmin } from "@/server/auth";
import { countAllConversations } from "@/server/repositories/conversations";
import { countAllMessagesToday } from "@/server/repositories/messages";
import { listUsersForAdmin } from "@/server/repositories/profiles";
import { getSystemSettings } from "@/server/repositories/settings";
import { listUsageSinceAll } from "@/server/repositories/usage";
import { getDayRangeUtc } from "@/lib/time/day";
import { formatNumber } from "@/lib/format";
import { AdminLimitsForm } from "@/components/admin/AdminLimitsForm";
import { cardClass } from "@/components/ui/styles";

export default async function AdminOverviewPage() {
  await requireAdmin();

  const { start, end } = getDayRangeUtc("Asia/Baghdad");
  const [settings, users, conversations, messagesToday, usageRows] = await Promise.all([
    getSystemSettings(),
    listUsersForAdmin(1000),
    countAllConversations(),
    countAllMessagesToday(start.toISOString(), end.toISOString()),
    listUsageSinceAll(start.toISOString()),
  ]);

  const tokensToday = usageRows.reduce((sum, row) => sum + row.totalTokens, 0);
  const activeUsers = users.filter((user) => user.isActive).length;

  const stats = [
    { label: ar.admin.overview.users, value: formatNumber(users.length) },
    { label: ar.admin.overview.activeUsers, value: formatNumber(activeUsers) },
    { label: ar.admin.overview.conversations, value: formatNumber(conversations) },
    { label: ar.admin.overview.messagesToday, value: formatNumber(messagesToday) },
    { label: ar.admin.overview.tokensToday, value: formatNumber(tokensToday) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">{ar.admin.title}</h1>

      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className={cardClass}>
            <p className="text-sm text-ink-2">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <AdminLimitsForm
        initial={{
          dailyMessageLimit: settings?.daily_message_limit ?? 40,
          dailyTokenLimit: settings?.daily_token_limit ?? 80000,
        }}
        defaultModel={settings?.default_model ?? ""}
      />
    </div>
  );
}
