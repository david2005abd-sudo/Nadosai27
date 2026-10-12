"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Bell, Menu, Shield } from "lucide-react";
import { ar } from "@/messages/ar";
import { apiFetch } from "@/lib/api-client";
import { getBrowserSupabase } from "@/server/supabase/client";
import { DrawerContent } from "@/components/app/Drawer";
import { btnIcon } from "@/components/ui/styles";
import { cn } from "@/lib/utils";

export function SignOutButton({ className, label }: { className?: string; label?: string }) {
  const router = useRouter();

  async function signOut() {
    try {
      const supabase = getBrowserSupabase();
      await supabase.auth.signOut();
    } catch {
      void 0;
    }
    router.replace("/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={signOut} className={className ?? btnIcon}>
      {label ?? ar.common.signOut}
    </button>
  );
}

function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications-unread"],
    queryFn: () => apiFetch<{ unread: number }>("/api/notifications"),
    select: (data) => data.unread,
    refetchInterval: 60_000,
  });
}

export function AppShell({ isAdmin, children }: { isAdmin: boolean; children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const unread = useUnreadCount();

  const drawer = (
    <DrawerContent
      isAdmin={isAdmin}
      onNavigate={() => setDrawerOpen(false)}
      onClose={() => setDrawerOpen(false)}
    />
  );

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center gap-2 border-b border-edge bg-surface px-3 py-2">
        <button
          type="button"
          className={btnIcon + " lg:hidden"}
          onClick={() => setDrawerOpen(true)}
          aria-label={ar.app.nav.menu}
          aria-expanded={drawerOpen}
        >
          <Menu size={18} aria-hidden />
        </button>
        <Link href="/app" className="px-2 font-bold">
          {ar.appName}
        </Link>
        <div className="ms-auto flex items-center gap-1">
          {isAdmin ? (
            <Link
              href="/admin"
              className="hidden min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-ink-2 hover:bg-raised hover:text-ink md:flex"
            >
              <Shield size={16} aria-hidden />
              {ar.app.nav.admin}
            </Link>
          ) : null}
          <Link
            href="/app/notifications"
            className={cn(btnIcon, "relative")}
            aria-label={ar.app.nav.notifications}
          >
            <Bell size={18} aria-hidden />
            {unread.data ? (
              <span className="absolute -top-1 -end-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
                {unread.data > 9 ? "9+" : unread.data}
              </span>
            ) : null}
          </Link>
          <SignOutButton className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-ink-2 hover:bg-raised hover:text-ink" />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-72 shrink-0 border-e border-edge bg-surface lg:block">
          {drawer}
        </aside>

        {drawerOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <aside className="absolute inset-y-0 start-0 flex w-80 max-w-[85vw] flex-col border-e border-edge bg-surface">
              {drawer}
            </aside>
          </div>
        ) : null}

        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
