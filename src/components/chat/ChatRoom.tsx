"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Pencil, RefreshCw, ThumbsDown, ThumbsUp, BookMarked } from "lucide-react";
import { ar } from "@/messages/ar";
import { apiFetch, ApiError } from "@/lib/api-client";
import { truncateTitle } from "@/lib/text/title";
import { Markdown } from "@/components/chat/Markdown";
import { btnIcon } from "@/components/ui/styles";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  model?: string | null;
  provider?: string | null;
  status?: string | null;
  vote?: number | null;
  pending?: boolean;
}

interface MessagesResponse {
  conversation: {
    id: string;
    title: string;
    model: string;
    isPinned: boolean;
    isArchived: boolean;
  };
  messages: ChatMessage[];
}

const MAX_INPUT_LENGTH = 8000;

export function ChatRoom({
  conversationId,
  initialTitle,
  initialMessages,
}: {
  conversationId: string;
  initialTitle: string;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [title, setTitle] = useState(initialTitle);
  const [streamText, setStreamText] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(initialTitle);

  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const refreshMessages = useCallback(async () => {
    try {
      const data = await apiFetch<MessagesResponse>(
        `/api/conversations/${conversationId}/messages`,
      );
      setMessages(data.messages);
      setTitle(data.conversation.title);
    } catch {
      setError(ar.app.chat.loadError);
    }
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, streamText]);

  async function readStream(response: Response, signal: AbortSignal): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) setStreamText((previous) => (previous ?? "") + chunk);
      }
    } catch (streamError) {
      if (!(signal.aborted && streamError instanceof DOMException)) throw streamError;
    } finally {
      reader.releaseLock();
    }
  }

  async function runGeneration(url: string, body: string) {
    const controller = new AbortController();
    abortRef.current = controller;
    setSending(true);
    setError(null);
    setStreamText("");
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: controller.signal,
      });
      if (!response.ok) {
        const data: { error?: { message?: string } } = await response.json().catch(() => null);
        setError(data?.error?.message ?? ar.app.chat.errorGeneric);
        return;
      }
      await readStream(response, controller.signal);
    } catch (requestError) {
      if (!(requestError instanceof DOMException && requestError.name === "AbortError")) {
        setError(ar.app.chat.errorGeneric);
      }
    } finally {
      abortRef.current = null;
      setSending(false);
      setStreamText(null);
      await refreshMessages();
    }
  }

  async function send() {
    const content = input.trim();
    if (!content || sending) return;
    const clientMessageId = crypto.randomUUID();
    setInput("");
    setMessages((previous) => [
      ...previous,
      {
        id: clientMessageId,
        role: "user",
        content,
        createdAt: new Date().toISOString(),
        pending: true,
      },
    ]);
    await runGeneration("/api/chat", JSON.stringify({ conversationId, content, clientMessageId }));
  }

  async function regenerate() {
    if (sending) return;
    await runGeneration(`/api/conversations/${conversationId}/regenerate`, "{}");
  }

  function stop() {
    abortRef.current?.abort();
  }

  async function copyMessage(message: ChatMessage) {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedId(message.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      setError(ar.app.chat.errorGeneric);
    }
  }

  async function voteMessage(message: ChatMessage, value: 1 | -1) {
    const next = message.vote === value ? 0 : value;
    try {
      await apiFetch(`/api/messages/${message.id}/feedback`, {
        method: "POST",
        body: JSON.stringify({ vote: next }),
      });
      setMessages((previous) =>
        previous.map((item) => (item.id === message.id ? { ...item, vote: next || null } : item)),
      );
    } catch (voteError) {
      setError(voteError instanceof ApiError ? voteError.message : ar.app.chat.errorGeneric);
    }
  }

  async function saveToLibrary(message: ChatMessage) {
    try {
      await apiFetch("/api/library", {
        method: "POST",
        body: JSON.stringify({
          title: truncateTitle(title, 120),
          content: message.content,
          sourceMessageId: message.id,
        }),
      });
      setSavedId(message.id);
      setTimeout(() => setSavedId(null), 1500);
    } catch (saveError) {
      setError(saveError instanceof ApiError ? saveError.message : ar.app.library.error);
    }
  }

  async function renameTitle() {
    const value = renameValue.trim();
    setRenaming(false);
    if (!value || value === title) return;
    try {
      const data = await apiFetch<{ conversation: { title: string } }>(
        `/api/conversations/${conversationId}`,
        { method: "PATCH", body: JSON.stringify({ title: value }) },
      );
      setTitle(data.conversation.title);
    } catch (renameError) {
      setError(renameError instanceof ApiError ? renameError.message : ar.app.sidebar.actionFailed);
    }
  }

  const lastUserIndex = (() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index]?.role === "user") return index;
    }
    return -1;
  })();
  const lastAssistantIndex = (() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index]?.role === "assistant") return index;
    }
    return -1;
  })();
  const showRetry = !sending && lastAssistantIndex < lastUserIndex && lastUserIndex >= 0;
  const lastAssistant = messages[lastAssistantIndex];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-edge bg-surface px-4 py-2">
        {renaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void renameTitle();
              if (event.key === "Escape") setRenaming(false);
            }}
            onBlur={() => void renameTitle()}
            className="flex-1 min-h-9 rounded-lg border border-edge bg-surface px-3 py-1.5 text-sm"
            aria-label={ar.app.sidebar.rename}
          />
        ) : (
          <>
            <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</h1>
            <button
              type="button"
              className={cn(btnIcon, "h-9 w-9 min-h-9")}
              onClick={() => {
                setRenameValue(title);
                setRenaming(true);
              }}
              aria-label={ar.app.sidebar.rename}
            >
              <Pencil size={15} aria-hidden />
            </button>
          </>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4">
        {messages.length === 0 && !streamText ? (
          <div className="mx-auto max-w-md pt-16 text-center">
            <h2 className="mb-2 text-lg font-semibold">{ar.app.chat.emptyTitle}</h2>
            <p className="text-sm text-ink-2">{ar.app.chat.emptyBody}</p>
          </div>
        ) : null}

        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.map((message, index) => {
            const isUser = message.role === "user";
            const isLastAssistant = index === lastAssistantIndex;
            return (
              <div
                key={message.id}
                className={cn("flex", isUser ? "justify-start" : "justify-end")}
              >
                <div
                  className={cn(
                    "w-full max-w-[85%] rounded-2xl border px-4 py-3 text-sm",
                    isUser
                      ? "rounded-ts-sm border-edge bg-raised"
                      : "rounded-te-sm border-edge bg-surface",
                  )}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  ) : (
                    <Markdown content={message.content} />
                  )}
                  {!isUser && !message.pending ? (
                    <div className="mt-2 flex items-center gap-1 border-t border-edge pt-2">
                      <button
                        type="button"
                        className={cn(btnIcon, "h-8 w-8 min-h-8")}
                        onClick={() => void copyMessage(message)}
                        aria-label={ar.app.chat.copy}
                      >
                        {copiedId === message.id ? (
                          <Check size={14} aria-hidden className="text-success" />
                        ) : (
                          <Copy size={14} aria-hidden />
                        )}
                      </button>
                      <button
                        type="button"
                        className={cn(btnIcon, "h-8 w-8 min-h-8")}
                        onClick={() => void saveToLibrary(message)}
                        aria-label={ar.app.nav.library}
                      >
                        <BookMarked
                          size={14}
                          aria-hidden
                          className={savedId === message.id ? "text-success" : undefined}
                        />
                      </button>
                      {isLastAssistant ? (
                        <>
                          <button
                            type="button"
                            className={cn(
                              btnIcon,
                              "h-8 w-8 min-h-8",
                              message.vote === 1 && "text-accent",
                            )}
                            onClick={() => void voteMessage(message, 1)}
                            aria-label={ar.app.chat.voteUp}
                            aria-pressed={message.vote === 1}
                          >
                            <ThumbsUp size={14} aria-hidden />
                          </button>
                          <button
                            type="button"
                            className={cn(
                              btnIcon,
                              "h-8 w-8 min-h-8",
                              message.vote === -1 && "text-danger",
                            )}
                            onClick={() => void voteMessage(message, -1)}
                            aria-label={ar.app.chat.voteDown}
                            aria-pressed={message.vote === -1}
                          >
                            <ThumbsDown size={14} aria-hidden />
                          </button>
                          <button
                            type="button"
                            className={cn(btnIcon, "h-8 w-8 min-h-8")}
                            onClick={() => void regenerate()}
                            aria-label={ar.app.chat.regenerate}
                          >
                            <RefreshCw size={14} aria-hidden />
                          </button>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}

          {streamText !== null ? (
            <div className="flex justify-end">
              <div
                aria-live="polite"
                aria-label={ar.app.chat.streaming}
                className="w-full max-w-[85%] rounded-2xl rounded-te-sm border border-edge bg-surface px-4 py-3 text-sm"
              >
                {streamText ? (
                  <Markdown content={streamText} />
                ) : (
                  <p className="text-ink-2">{ar.common.loading}</p>
                )}
              </div>
            </div>
          ) : null}

          {showRetry ? (
            <div className="flex justify-end">
              <div className="rounded-xl border border-edge bg-surface px-4 py-3 text-sm">
                <p className="mb-2 text-danger">{ar.app.chat.replyFailed}</p>
                <button
                  type="button"
                  onClick={() => void regenerate()}
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-accent px-3 text-sm font-medium text-accent-ink"
                >
                  <RefreshCw size={14} aria-hidden />
                  {ar.app.chat.retry}
                </button>
              </div>
            </div>
          ) : null}

          {lastAssistant && lastAssistant.status === "error" && !showRetry ? (
            <p className="text-sm text-danger">{ar.app.chat.replyFailed}</p>
          ) : null}
        </div>
        <div ref={bottomRef} />
      </div>

      {error ? (
        <p role="alert" className="mx-auto w-full max-w-3xl px-4 pb-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="border-t border-edge bg-surface px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                void send();
              }
            }}
            rows={2}
            maxLength={MAX_INPUT_LENGTH}
            placeholder={ar.app.chat.composerPlaceholder}
            aria-label={ar.app.chat.composerPlaceholder}
            className="max-h-40 min-h-11 flex-1 resize-none rounded-xl border border-edge bg-surface px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
          {sending ? (
            <button
              type="button"
              onClick={stop}
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border border-edge px-4 font-medium hover:bg-raised"
            >
              {ar.app.chat.stop}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void send()}
              disabled={!input.trim()}
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 font-medium text-accent-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              {ar.app.chat.send}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
