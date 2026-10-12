"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ar } from "@/messages/ar";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Dialog } from "@/components/ui/Dialog";
import { inputClass } from "@/components/ui/styles";

export interface AdminUserRow {
  id: string;
  email: string | null;
  fullName: string | null;
  username: string | null;
  role: string;
  isActive: boolean;
  joinedLabel: string;
}

export function AdminUsersTable({ users }: { users: AdminUserRow[] }) {
  const [search, setSearch] = useState("");
  const [deactivating, setDeactivating] = useState<AdminUserRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (user) =>
        (user.email ?? "").toLowerCase().includes(q) ||
        (user.fullName ?? "").toLowerCase().includes(q) ||
        (user.username ?? "").toLowerCase().includes(q),
    );
  }, [users, search]);

  const mutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      apiFetch(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      setDeactivating(null);
      setError(null);
      void queryClient.invalidateQueries();
    },
    onError: (mutationError) => {
      setError(mutationError instanceof ApiError ? mutationError.message : ar.admin.users.error);
    },
  });

  if (users.length === 0) {
    return <p className="text-sm text-ink-2">{ar.admin.users.empty}</p>;
  }

  return (
    <div>
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={ar.admin.users.searchPlaceholder}
        aria-label={ar.admin.users.searchPlaceholder}
        className={`${inputClass} mb-4 max-w-sm`}
      />

      {error ? (
        <p role="alert" className="mb-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-edge">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-raised text-start">
            <tr>
              <th className="px-3 py-2 text-start">{ar.admin.users.name}</th>
              <th className="px-3 py-2 text-start">{ar.admin.users.role}</th>
              <th className="px-3 py-2 text-start">{ar.admin.users.status}</th>
              <th className="px-3 py-2 text-start">{ar.admin.users.joined}</th>
              <th className="px-3 py-2 text-start">{ar.admin.users.actions}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-t border-edge">
                <td className="px-3 py-2">
                  <p className="font-medium">{user.fullName ?? "—"}</p>
                  <p dir="ltr" className="text-start text-xs text-ink-2">
                    {user.email ?? ""}
                    {user.username ? ` · @${user.username}` : ""}
                  </p>
                </td>
                <td className="px-3 py-2">
                  {user.role === "admin" ? ar.admin.users.roleAdmin : ar.admin.users.roleUser}
                </td>
                <td className="px-3 py-2">
                  {user.isActive ? (
                    <span className="text-success">{ar.common.active}</span>
                  ) : (
                    <span className="text-danger">{ar.common.disabled}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-ink-2">{user.joinedLabel}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="min-h-9 rounded-lg border border-edge px-3 text-xs hover:bg-raised"
                      onClick={() => {
                        if (user.isActive) setDeactivating(user);
                        else
                          mutation.mutate({
                            id: user.id,
                            body: { isActive: true },
                          });
                      }}
                    >
                      {user.isActive ? ar.admin.users.deactivate : ar.admin.users.activate}
                    </button>
                    <button
                      type="button"
                      className="min-h-9 rounded-lg border border-edge px-3 text-xs hover:bg-raised"
                      onClick={() =>
                        mutation.mutate({
                          id: user.id,
                          body: { role: user.role === "admin" ? "user" : "admin" },
                        })
                      }
                    >
                      {user.role === "admin" ? ar.admin.users.makeUser : ar.admin.users.makeAdmin}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={deactivating !== null}
        title={ar.admin.users.confirmDeactivateTitle}
        onClose={() => setDeactivating(null)}
      >
        <p className="mb-4 text-sm text-ink-2">{ar.admin.users.confirmDeactivateBody}</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="min-h-11 rounded-lg bg-danger px-4 font-medium text-white"
            disabled={mutation.isPending}
            onClick={() => {
              if (deactivating) mutation.mutate({ id: deactivating.id, body: { isActive: false } });
            }}
          >
            {ar.admin.users.deactivate}
          </button>
          <button
            type="button"
            className="min-h-11 rounded-lg border border-edge px-4 font-medium"
            onClick={() => setDeactivating(null)}
          >
            {ar.common.cancel}
          </button>
        </div>
      </Dialog>
    </div>
  );
}
