import { ar } from "@/messages/ar";
import { requireAdmin } from "@/server/auth";
import { listUsersForAdmin } from "@/server/repositories/profiles";
import { formatDateTime } from "@/lib/format";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await listUsersForAdmin(200);

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">{ar.admin.users.title}</h1>
      <AdminUsersTable
        users={users.map((user) => ({
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          username: user.username,
          role: user.role,
          isActive: user.isActive,
          joinedLabel: formatDateTime(user.createdAt),
        }))}
      />
    </div>
  );
}
