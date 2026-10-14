"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bell, Menu, PanelLeft, Shield } from "lucide-react";
import { ar } from "@/messages/ar";
import { apiFetch } from "@/lib/api-client";
import { DrawerContent } from "@/components/app/Drawer";
import { SignOutButton } from "@/components/app/SignOutButton";
import { ThemeToggleButton } from "@/components/ui/ThemeSwitch";
import { btnIconBare } from "@/components/ui/styles";
import { cn } from "@/lib/utils";

export { SignOutButton };

function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications-unread"],
    queryFn: () => apiFetch<{ unread: number }>("/api/notifications"),
    select: (data) => data.unread,
    refetchInterval: 60_000,
  });
}

export function AppShell({
  isAdmin,
  userName,
  children,
}: {
  isAdmin: boolean;
  userName: string;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const unread = useUnreadCount();

  const drawer = (
    <DrawerContent
      isAdmin={isAdmin}
      userName={userName}
      onNavigate={() => setDrawerOpen(false)}
      onClose={() => setDrawerOpen(false)}
    />
  );

  return (
    <div
      className={cn(
        "grid h-dvh grid-cols-1 overflow-hidden",
        collapsed
          ? "lg:grid-cols-[0px_minmax(0,1fr)]"
          : "lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)]",
      )}
    >
      <aside
        className={cn(
          "z-20 hidden min-w-0 flex-col overflow-hidden border-e border-edge bg-sidebar transition-opacity duration-300 lg:flex",
          collapsed && "pointer-events-none opacity-0",
        )}
      >
        {drawer}
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex h-[var(--topbar-h)] flex-none items-center gap-1.5 border-b border-edge bg-bg px-3">
          <button
            type="button"
            className={cn(btnIconBare, "lg:hidden")}
            onClick={() => setDrawerOpen(true)}
            aria-label={ar.app.nav.menu}
            aria-expanded={drawerOpen}
          >
            <Menu size={18} aria-hidden />
          </button>
          <button
            type="button"
            className={cn(btnIconBare, "hidden lg:inline-flex")}
            onClick={() => setCollapsed((value) => !value)}
            aria-label={ar.app.nav.toggleSidebar}
            title={ar.app.nav.toggleSidebar}
            aria-pressed={collapsed}
          >
            <PanelLeft size={18} aria-hidden />
          </button>

          <div className="ms-auto flex items-center gap-1">
            <ThemeToggleButton />
            {isAdmin ? (
              <Link
                href="/admin"
                className="hidden min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-ink-2 hover:bg-hover hover:text-ink md:flex"
              >
                <Shield size={16} aria-hidden />
                {ar.app.nav.admin}
              </Link>
            ) : null}
            <Link
              href="/app/notifications"
              className={cn(btnIconBare, "relative")}
              aria-label={ar.app.nav.notifications}
            >
              <Bell size={18} aria-hidden />
              {unread.data ? (
                <span className="absolute -top-0.5 -end-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
                  {unread.data > 9 ? "9+" : unread.data}
                </span>
              ) : null}
            </Link>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          {drawerOpen ? (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div
                className="absolute inset-0 bg-black/60"
                onClick={() => setDrawerOpen(false)}
                aria-hidden="true"
              />
              <aside className="absolute inset-y-0 start-0 flex w-80 max-w-[85vw] flex-col border-e border-edge bg-sidebar">
                {drawer}
              </aside>
            </div>
          ) : null}

          <main className="flex min-w-0 flex-1 flex-col">{children}</main>
        </div>
      </div>
    </div>
  );
}
