import type { Metadata } from "next";
import Link from "next/link";
import { ar } from "@/messages/ar";
import { requireAdmin } from "@/server/auth";
import { QueryProvider } from "@/components/providers/QueryProvider";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: ar.admin.title,
};

const items = [
  { href: "/admin", label: ar.admin.nav.overview },
  { href: "/admin/users", label: ar.admin.nav.users },
  { href: "/admin/usage", label: ar.admin.nav.usage },
  { href: "/admin/models", label: ar.admin.nav.models },
  { href: "/admin/inbox", label: ar.admin.nav.inbox },
  { href: "/admin/audit", label: ar.admin.nav.audit },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <QueryProvider>
      <div className="flex min-h-dvh flex-col">
        <header className="border-b border-edge bg-surface">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
            <Link href="/admin" className="font-bold">
              {ar.admin.title}
            </Link>
            <nav aria-label={ar.admin.title} className="flex flex-wrap items-center gap-1">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-sm text-ink-2 hover:bg-raised hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <Link href="/app" className="ms-auto text-sm text-link hover:underline">
              {ar.nav.app}
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      </div>
    </QueryProvider>
  );
}
