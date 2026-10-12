"use client";

import { useEffect, useState } from "react";

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

  if (html) {
    return (
      <div
        dir="ltr"
        className="my-2 overflow-x-auto rounded-lg border border-edge bg-raised text-left text-xs [&_pre]:p-3"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <pre
      dir="ltr"
      className="my-2 overflow-x-auto rounded-lg border border-edge bg-raised p-3 text-left font-mono text-xs"
    >
      <code>{code}</code>
    </pre>
  );
}
