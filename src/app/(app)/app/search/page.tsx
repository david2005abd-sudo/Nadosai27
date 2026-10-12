"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon } from "lucide-react";
import { ar } from "@/messages/ar";
import { apiFetch } from "@/lib/api-client";
import { formatDateOnly } from "@/lib/format";
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants";
import { inputClass } from "@/components/ui/styles";

interface SearchResultItem {
  type: "conversation" | "message";
  conversationId: string;
  title: string;
  snippet: string | null;
  role: string | null;
  createdAt: string;
}

export default function SearchPage() {
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(input.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input]);

  const query = useQuery({
    queryKey: ["search", debounced],
    queryFn: () =>
      apiFetch<{ results: SearchResultItem[] }>(`/api/search?q=${encodeURIComponent(debounced)}`),
    enabled: debounced.length > 0,
  });

  const results = query.data?.results ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <h1 className="mb-4 text-lg font-semibold">{ar.app.search.title}</h1>

        <div className="relative">
          <SearchIcon
            size={16}
            aria-hidden
            className="pointer-events-none absolute inset-y-0 start-3 my-auto text-ink-2"
          />
          <input
            type="search"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={ar.app.search.placeholder}
            aria-label={ar.app.search.placeholder}
            className={`${inputClass} ps-9`}
          />
        </div>
        <p className="mt-2 text-xs text-ink-2">{ar.app.search.hint}</p>

        <div className="mt-6 flex flex-col gap-3">
          {query.isLoading ? <p className="text-sm text-ink-2">{ar.common.loading}</p> : null}
          {query.isError ? (
            <p role="alert" className="text-sm text-danger">
              {ar.app.search.error}
            </p>
          ) : null}
          {!query.isLoading && debounced && results.length === 0 ? (
            <p className="text-sm text-ink-2">{ar.app.search.noResults}</p>
          ) : null}

          {results.map((result) => (
            <Link
              key={`${result.type}-${result.conversationId}-${result.createdAt}`}
              href={`/app/c/${result.conversationId}`}
              className="rounded-xl border border-edge bg-surface p-4 transition-colors hover:bg-raised"
            >
              <p className="mb-1 text-xs text-ink-2">
                {result.type === "conversation" ? ar.app.search.inTitle : ar.app.search.inMessage}
                {" · "}
                {formatDateOnly(result.createdAt)}
              </p>
              <p className="font-medium">{result.title}</p>
              {result.snippet ? <p className="mt-1 text-sm text-ink-2">{result.snippet}</p> : null}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
