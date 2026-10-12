"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { CodeBlock } from "@/components/chat/CodeBlock";

export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose-chat text-start">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          a: ({ node: _node, ...props }) => {
            const href = props.href ?? "";
            if (href.toLowerCase().startsWith("javascript:")) return null;
            return <a {...props} target="_blank" rel="noopener noreferrer" />;
          },
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children }) => {
            const text = String(children ?? "").replace(/\n$/, "");
            const match = /language-([\w-]+)/.exec(className ?? "");
            if (!match && !text.includes("\n")) {
              return <code>{text}</code>;
            }
            return <CodeBlock code={text} lang={match?.[1] ?? ""} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
