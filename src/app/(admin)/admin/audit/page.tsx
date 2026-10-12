import { ar } from "@/messages/ar";
import { requireAdmin } from "@/server/auth";
import { listAuditLogs } from "@/server/repositories/audit";
import { listUsersForAdmin } from "@/server/repositories/profiles";
import { formatDateTime } from "@/lib/format";

export default async function AdminAuditPage() {
  await requireAdmin();
  const [logs, users] = await Promise.all([listAuditLogs(150), listUsersForAdmin(500)]);
  const emailById = new Map(users.map((user) => [user.id, user.email]));

  function actionLabel(action: string): string {
    const actions = ar.admin.audit.actions as Record<string, string>;
    return actions[action] ?? action;
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">{ar.admin.audit.title}</h1>
      {logs.length === 0 ? (
        <p className="text-sm text-ink-2">{ar.admin.audit.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-edge">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-raised">
              <tr>
                <th className="px-3 py-2 text-start">{ar.admin.audit.action}</th>
                <th className="px-3 py-2 text-start">{ar.admin.audit.actor}</th>
                <th className="px-3 py-2 text-start">{ar.admin.audit.entity}</th>
                <th className="px-3 py-2 text-start">{ar.admin.audit.when}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-edge">
                  <td className="px-3 py-2">{actionLabel(log.action)}</td>
                  <td className="px-3 py-2" dir="ltr">
                    {log.user_id ? (emailById.get(log.user_id) ?? "—") : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-ink-2">
                    {log.entity_type ?? "—"}
                    {log.entity_id ? ` · ${log.entity_id.slice(0, 8)}…` : ""}
                  </td>
                  <td className="px-3 py-2 text-xs text-ink-2">{formatDateTime(log.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
