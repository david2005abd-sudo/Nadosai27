import { ar } from "@/messages/ar";
import { requireAdmin } from "@/server/auth";
import { listContactMessages } from "@/server/repositories/contact";
import { formatDateTime } from "@/lib/format";
import { AdminInboxList } from "@/components/admin/AdminInboxList";

export default async function AdminInboxPage() {
  await requireAdmin();
  const messages = await listContactMessages(100);

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">{ar.admin.inbox.title}</h1>
      <AdminInboxList
        messages={messages.map((message) => ({
          id: message.id,
          name: message.name,
          email: message.email,
          subject: message.subject,
          body: message.message,
          status: message.status === "read" || message.status === "closed" ? message.status : "new",
          whenLabel: formatDateTime(message.created_at),
        }))}
      />
    </div>
  );
}
