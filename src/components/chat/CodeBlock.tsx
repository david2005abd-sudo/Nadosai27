"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { ar } from "@/messages/ar";

const THEMES = ["github-dark-default"] as const;

const LANGS = [
  "javascript",
  "typescript",
  "tsx",
  "python",
  "bash",
  "json",
  "css",
  "html",
  "sql",
  "java",
  "go",
  "rust",
  "php",
  "cpp",
  "c",
];

let highlighterPromise: Promise<{
  codeToHtml: (code: string, options: { lang: string; theme: string }) => string;
} | null> | null = null;

async function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = (async () => {
      try {
        const { createHighlighter } = await import("shiki");
        const highlighter = await createHighlighter({
          themes: [...THEMES],
          langs: LANGS,
        });
        return {
          codeToHtml: (code: string, options: { lang: string; theme: string }) =>
            highlighter.codeToHtml(code, options),
        };
      } catch {
        return null;
      }
    })();
  }
  return highlighterPromise;
}

export function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const shikiLang = LANGS.includes(lang as (typeof LANGS)[number]) ? lang : "text";

  useEffect(() => {
    let active = true;
    void (async () => {
      const highlighter = await getHighlighter();
      if (!highlighter || !active || shikiLang === "text") return;
      try {
        const out = highlighter.codeToHtml(code, {
          lang: shikiLang,
          theme: THEMES[0] ?? "github-dark-default",
        });
        if (active) setHtml(out);
      } catch {
        if (active) setHtml(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [code, shikiLang]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      void 0;
    }
  }

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-edge bg-code">
      <div className="flex items-center gap-2 border-b border-edge bg-surface px-3 py-1.5">
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[.06em] text-ink-2">
          {shikiLang}
        </span>
        <button
          type="button"
          onClick={() => void copy()}
          className="ms-auto inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-[11.5px] text-ink-3 transition-colors hover:bg-hover hover:text-ink"
        >
          {copied ? (
            <Check size={12} aria-hidden className="text-success" />
          ) : (
            <Copy size={12} aria-hidden />
          )}
          {copied ? ar.common.copied : ar.common.copy}
        </button>
      </div>
      {html ? (
        <div
          dir="ltr"
          className="overflow-x-auto p-3.5 text-left text-[13px] [&_pre]:m-0 [&_pre]:bg-transparent! [&_pre]:p-0"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre
          dir="ltr"
          className="overflow-x-auto p-3.5 text-left font-mono text-[13px] leading-relaxed"
        >
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
