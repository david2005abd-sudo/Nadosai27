import type { Metadata } from "next";
import { ar } from "@/messages/ar";
import { requireUser } from "@/server/auth";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AppShell, SignOutButton } from "@/components/app/AppShell";
import { btnPrimary } from "@/components/ui/styles";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: ar.appName,
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  if (!user.profile.is_active) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-xl font-bold">{ar.app.inactiveTitle}</h1>
        <p className="max-w-md text-ink-2">{ar.app.inactiveBody}</p>
        <SignOutButton className={btnPrimary} />
      </main>
    );
  }

  return (
    <QueryProvider>
      <AppShell isAdmin={user.isAdmin} userName={user.profile.full_name ?? user.email ?? "؟"}>
        {children}
      </AppShell>
    </QueryProvider>
  );
}
