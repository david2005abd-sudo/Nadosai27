"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import {
  Archive,
  ArchiveRestore,
  BarChart3,
  Bell,
  BookMarked,
  KeyRound,
  Library,
  MoreVertical,
  Pencil,
  Pin,
  PinOff,
  Search,
  Settings,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { ar } from "@/messages/ar";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatDateOnly } from "@/lib/format";
import { Dialog } from "@/components/ui/Dialog";
import { NewConversationButton } from "@/components/app/NewConversationButton";
import { btnIcon } from "@/components/ui/styles";
import { cn } from "@/lib/utils";

export interface ConversationItem {
  id: string;
  title: string;
  isPinned: boolean;
  isArchived: boolean;
  lastMessageAt: string | null;
  messageCount: number;
}

interface ConversationsPage {
  conversations: ConversationItem[];
  limit: number;
  offset: number;
}

const PAGE_SIZE = 30;

function useConversations(archived: boolean) {
  return useInfiniteQuery({
    queryKey: ["conversations", archived],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      apiFetch<ConversationsPage>(
        `/api/conversations?archived=${archived ? 1 : 0}&limit=${PAGE_SIZE}&offset=${pageParam}`,
      ),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.conversations.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
  });
}

export function DrawerContent({
  onNavigate,
  onClose,
  isAdmin,
}: {
  onNavigate?: () => void;
  onClose?: () => void;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [archived, setArchived] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleting, setDeleting] = useState<ConversationItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const query = useConversations(archived);
  const conversations = query.data?.pages.flatMap((page) => page.conversations) ?? [];
  const pinned = conversations.filter((conversation) => conversation.isPinned);
  const recent = conversations.filter((conversation) => !conversation.isPinned);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["conversations"] });
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      apiFetch(`/api/conversations/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError: (error) => {
      setActionError(error instanceof ApiError ? error.message : ar.app.sidebar.actionFailed);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/conversations/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      setDeleting(null);
      setActionError(null);
      invalidate();
      void queryClient.invalidateQueries({ queryKey: ["conversation"] });
      router.push("/app");
    },
    onError: (error) => {
      setActionError(error instanceof ApiError ? error.message : ar.app.sidebar.actionFailed);
    },
  });

  const navLinks = [
    {
      href: "/app/search",
      label: ar.app.sidebar.searchLink,
      icon: <Search size={18} aria-hidden />,
    },
    { href: "/app/library", label: ar.app.nav.library, icon: <BookMarked size={18} aria-hidden /> },
    {
      href: "/app/notifications",
      label: ar.app.nav.notifications,
      icon: <Bell size={18} aria-hidden />,
    },
    { href: "/app/usage", label: ar.app.nav.usage, icon: <BarChart3 size={18} aria-hidden /> },
    { href: "/app/api-keys", label: ar.app.nav.apiKeys, icon: <KeyRound size={18} aria-hidden /> },
    { href: "/app/settings", label: ar.app.nav.settings, icon: <Settings size={18} aria-hidden /> },
  ];

  function renderRow(conversation: ConversationItem) {
    const isRenaming = renamingId === conversation.id;
    const isMenuOpen = menuFor === conversation.id;

    if (isRenaming) {
      return (
        <li key={conversation.id} className="rounded-lg border border-edge bg-raised p-2">
          <input
            autoFocus
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            className="w-full min-h-11 rounded-lg border border-edge bg-surface px-3 py-2 text-sm"
            aria-label={ar.app.sidebar.rename}
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="min-h-9 rounded-lg bg-accent px-3 text-sm font-medium text-accent-ink"
              onClick={() => {
                if (renameValue.trim()) {
                  updateMutation.mutate({
                    id: conversation.id,
                    patch: { title: renameValue.trim() },
                  });
                }
                setRenamingId(null);
              }}
            >
              {ar.common.save}
            </button>
            <button
              type="button"
              className="min-h-9 rounded-lg border border-edge px-3 text-sm"
              onClick={() => setRenamingId(null)}
            >
              {ar.common.cancel}
            </button>
          </div>
        </li>
      );
    }

    return (
      <li key={conversation.id}>
        <div
          className={cn(
            "group flex items-start gap-1 rounded-lg px-2 py-1 transition-colors",
            isMenuOpen ? "bg-raised" : "hover:bg-raised",
          )}
        >
          <Link
            href={`/app/c/${conversation.id}`}
            onClick={() => {
              setMenuFor(null);
              onNavigate?.();
            }}
            className="min-h-11 flex-1 px-1 py-2"
          >
            <span className="block truncate text-sm font-medium">{conversation.title}</span>
            <span className="block text-xs text-ink-2">
              {conversation.lastMessageAt
                ? formatDateOnly(conversation.lastMessageAt)
                : ar.common.empty}
            </span>
          </Link>
          <button
            type="button"
            aria-label={ar.common.edit}
            aria-expanded={isMenuOpen}
            className={btnIcon + " h-9 w-9 min-h-9"}
            onClick={() => setMenuFor(isMenuOpen ? null : conversation.id)}
          >
            <MoreVertical size={16} aria-hidden />
          </button>
        </div>
        {isMenuOpen ? (
          <div className="mb-2 flex flex-wrap gap-1 px-2">
            <button
              type="button"
              className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-edge px-2 text-xs"
              onClick={() => {
                setRenameValue(conversation.title);
                setRenamingId(conversation.id);
                setMenuFor(null);
              }}
            >
              <Pencil size={14} aria-hidden />
              {ar.app.sidebar.rename}
            </button>
            <button
              type="button"
              className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-edge px-2 text-xs"
              onClick={() => {
                updateMutation.mutate({
                  id: conversation.id,
                  patch: { isPinned: !conversation.isPinned },
                });
                setMenuFor(null);
              }}
            >
              {conversation.isPinned ? (
                <PinOff size={14} aria-hidden />
              ) : (
                <Pin size={14} aria-hidden />
              )}
              {conversation.isPinned ? ar.app.sidebar.unpin : ar.app.sidebar.pin}
            </button>
            <button
              type="button"
              className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-edge px-2 text-xs"
              onClick={() => {
                updateMutation.mutate({
                  id: conversation.id,
                  patch: { isArchived: !conversation.isArchived },
                });
                setMenuFor(null);
              }}
            >
              {conversation.isArchived ? (
                <ArchiveRestore size={14} aria-hidden />
              ) : (
                <Archive size={14} aria-hidden />
              )}
              {conversation.isArchived ? ar.app.sidebar.unarchive : ar.app.sidebar.archive}
            </button>
            <button
              type="button"
              className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-edge px-2 text-xs text-danger"
              onClick={() => {
                setDeleting(conversation);
                setMenuFor(null);
              }}
            >
              <Trash2 size={14} aria-hidden />
              {ar.app.sidebar.delete}
            </button>
          </div>
        ) : null}
      </li>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between gap-2 px-3 py-3 lg:hidden">
        <span className="font-bold">{ar.appName}</span>
        <button
          type="button"
          className={btnIcon}
          onClick={onClose}
          aria-label={ar.app.nav.closeMenu}
        >
          <X size={18} aria-hidden />
        </button>
      </div>

      <div className="px-3 pb-2">
        <NewConversationButton
          className="flex w-full min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 font-medium text-accent-ink"
          onCreated={onNavigate}
        />
      </div>

      <nav className="flex flex-col gap-1 px-3 pb-2" aria-label={ar.app.nav.menu}>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-ink-2 hover:bg-raised hover:text-ink"
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
        {isAdmin ? (
          <Link
            href="/admin"
            onClick={onNavigate}
            className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-ink-2 hover:bg-raised hover:text-ink"
          >
            <Shield size={18} aria-hidden />
            {ar.app.nav.admin}
          </Link>
        ) : null}
      </nav>

      <div className="flex items-center justify-between px-3 pb-1">
        <button
          type="button"
          onClick={() => setArchived((value) => !value)}
          className={cn(
            "inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium",
            archived ? "bg-raised text-ink" : "text-ink-2 hover:text-ink",
          )}
        >
          <Library size={16} aria-hidden />
          {archived ? ar.app.sidebar.archived : ar.app.sidebar.archiveToggle}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {query.isLoading ? <p className="p-2 text-sm text-ink-2">{ar.common.loading}</p> : null}
        {query.isError ? (
          <p role="alert" className="p-2 text-sm text-danger">
            {ar.app.sidebar.actionFailed}
          </p>
        ) : null}

        {!query.isLoading && conversations.length === 0 ? (
          <p className="p-2 text-sm text-ink-2">{ar.app.sidebar.noConversations}</p>
        ) : null}

        {pinned.length > 0 ? (
          <>
            <p className="px-2 pb-1 pt-2 text-xs font-semibold text-ink-2">
              {ar.app.sidebar.pinned}
            </p>
            <ul className="flex flex-col gap-0.5">{pinned.map(renderRow)}</ul>
          </>
        ) : null}

        {recent.length > 0 ? (
          <>
            <p className="px-2 pb-1 pt-2 text-xs font-semibold text-ink-2">
              {ar.app.sidebar.recent}
            </p>
            <ul className="flex flex-col gap-0.5">{recent.map(renderRow)}</ul>
          </>
        ) : null}

        {query.hasNextPage ? (
          <button
            type="button"
            onClick={() => void query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
            className="mt-2 w-full min-h-11 rounded-lg border border-edge text-sm font-medium hover:bg-raised"
          >
            {query.isFetchingNextPage ? ar.common.loading : ar.app.sidebar.loadMore}
          </button>
        ) : null}

        {actionError ? (
          <p role="alert" className="mt-2 text-sm text-danger">
            {actionError}
          </p>
        ) : null}
      </div>

      <Dialog
        open={deleting !== null}
        title={ar.app.sidebar.deleteTitle}
        onClose={() => setDeleting(null)}
      >
        <p className="mb-4 text-sm text-ink-2">{ar.app.sidebar.deleteBody}</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="min-h-11 rounded-lg bg-danger px-4 font-medium text-white"
            onClick={() => {
              if (deleting) deleteMutation.mutate(deleting.id);
            }}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? ar.common.saving : ar.common.delete}
          </button>
          <button
            type="button"
            className="min-h-11 rounded-lg border border-edge px-4 font-medium"
            onClick={() => setDeleting(null)}
          >
            {ar.common.cancel}
          </button>
        </div>
      </Dialog>
    </div>
  );
}
