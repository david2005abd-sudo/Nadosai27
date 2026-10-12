"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { ar } from "@/messages/ar";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatDateOnly } from "@/lib/format";
import { Dialog } from "@/components/ui/Dialog";
import { btnPrimary, cardClass, inputClass, labelClass } from "@/components/ui/styles";

interface Snippet {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function LibraryPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Snippet | null>(null);

  const query = useQuery({
    queryKey: ["library"],
    queryFn: () => apiFetch<{ snippets: Snippet[] }>("/api/library"),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch("/api/library", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      }),
    onSuccess: () => {
      setTitle("");
      setContent("");
      setFormError(null);
      setNotice(ar.app.library.saved);
      void queryClient.invalidateQueries({ queryKey: ["library"] });
    },
    onError: (error) => {
      setNotice(null);
      setFormError(error instanceof ApiError ? error.message : ar.app.library.error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/library/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      setDeleting(null);
      void queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });

  const snippets = query.data?.snippets ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <h1 className="text-lg font-semibold">{ar.app.library.title}</h1>
        <p className="mb-6 mt-1 text-sm text-ink-2">{ar.app.library.desc}</p>

        <section
          aria-label={ar.app.library.addTitle}
          className="mb-8 rounded-xl border border-edge bg-surface p-4"
        >
          <h2 className="mb-3 font-medium">{ar.app.library.addTitle}</h2>
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              setNotice(null);
              setFormError(null);
              if (!title.trim() || !content.trim()) {
                setFormError(
                  !title.trim() ? ar.app.library.titleRequired : ar.app.library.contentRequired,
                );
                return;
              }
              createMutation.mutate();
            }}
            noValidate
          >
            <div>
              <label htmlFor="snippet-title" className={labelClass}>
                {ar.app.library.titleField}
              </label>
              <input
                id="snippet-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className={inputClass}
                maxLength={120}
              />
            </div>
            <div>
              <label htmlFor="snippet-content" className={labelClass}>
                {ar.app.library.contentField}
              </label>
              <textarea
                id="snippet-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={5}
                className={inputClass}
                maxLength={8000}
              />
            </div>
            {formError ? (
              <p role="alert" className="text-sm text-danger">
                {formError}
              </p>
            ) : null}
            {notice ? (
              <p role="status" className="text-sm text-success">
                {notice}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={createMutation.isPending}
              className={`${btnPrimary} self-start`}
            >
              {createMutation.isPending ? ar.common.saving : ar.app.library.save}
            </button>
          </form>
        </section>

        {query.isLoading ? <p className="text-sm text-ink-2">{ar.common.loading}</p> : null}
        {!query.isLoading && snippets.length === 0 ? (
          <p className="text-sm text-ink-2">{ar.app.library.empty}</p>
        ) : null}

        <ul className="flex flex-col gap-3">
          {snippets.map((snippet) => (
            <li key={snippet.id} className={cardClass}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-medium">{snippet.title}</h3>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink-2">
                    {snippet.content}
                  </p>
                  <p className="mt-2 text-xs text-ink-2">{formatDateOnly(snippet.createdAt)}</p>
                </div>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-edge text-danger hover:bg-raised"
                  onClick={() => setDeleting(snippet)}
                  aria-label={ar.app.library.delete}
                >
                  <Trash2 size={16} aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Dialog
        open={deleting !== null}
        title={ar.app.library.deleteTitle}
        onClose={() => setDeleting(null)}
      >
        <p className="mb-4 text-sm text-ink-2">{ar.app.library.deleteBody}</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="min-h-11 rounded-lg bg-danger px-4 font-medium text-white"
            disabled={deleteMutation.isPending}
            onClick={() => {
              if (deleting) deleteMutation.mutate(deleting.id);
            }}
          >
            {ar.common.delete}
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
