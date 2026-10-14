"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  BookMarked,
  Check,
  Copy,
  Download,
  Pencil,
  RefreshCw,
  Square,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  User,
} from "lucide-react";
import { ar } from "@/messages/ar";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatTimeOnly } from "@/lib/format";
import { truncateTitle } from "@/lib/text/title";
import { Markdown } from "@/components/chat/Markdown";
import { Dialog } from "@/components/ui/Dialog";
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

function BrandMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M10 22V10l12 12V10"
        stroke="#fff"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="22" cy="10" r="2.6" fill="#10CFA0" />
    </svg>
  );
}

function MessageActions({
  message,
  isLastAssistant,
  copiedId,
  savedId,
  onCopy,
  onSave,
  onVote,
  onRegenerate,
}: {
  message: ChatMessage;
  isLastAssistant: boolean;
  copiedId: string | null;
  savedId: string | null;
  onCopy: () => void;
  onSave: () => void;
  onVote: (value: 1 | -1) => void;
  onRegenerate: () => void;
}) {
  const actionClass =
    "inline-flex h-7 items-center gap-1.5 rounded-lg px-2 text-xs text-ink-3 transition-colors hover:bg-hover hover:text-ink";

  return (
    <div className="mt-2.5 flex min-h-7 flex-wrap items-center gap-0.5">
      <button type="button" className={actionClass} onClick={onCopy}>
        {copiedId === message.id ? (
          <Check size={13} aria-hidden className="text-success" />
        ) : (
          <Copy size={13} aria-hidden />
        )}
        {copiedId === message.id ? ar.common.copied : ar.app.chat.copy}
      </button>
      <button
        type="button"
        className={cn(actionClass, savedId === message.id && "text-success")}
        onClick={onSave}
      >
        <BookMarked size={13} aria-hidden />
        {ar.app.nav.library}
      </button>
      {isLastAssistant ? (
        <>
          <button
            type="button"
            className={cn(actionClass, message.vote === 1 && "text-accent")}
            onClick={() => onVote(1)}
            aria-pressed={message.vote === 1}
          >
            <ThumbsUp size={13} aria-hidden />
            {ar.app.chat.voteUp}
          </button>
          <button
            type="button"
            className={cn(actionClass, message.vote === -1 && "text-danger")}
            onClick={() => onVote(-1)}
            aria-pressed={message.vote === -1}
          >
            <ThumbsDown size={13} aria-hidden />
            {ar.app.chat.voteDown}
          </button>
          <button type="button" className={actionClass} onClick={onRegenerate}>
            <RefreshCw size={13} aria-hidden />
            {ar.app.chat.regenerate}
          </button>
        </>
      ) : null}
    </div>
  );
}

export function ChatRoom({
  conversationId,
  initialTitle,
  initialMessages,
}: {
  conversationId: string;
  initialTitle: string;
  initialMessages: ChatMessage[];
}) {
  const router = useRouter();
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
  const [deleting, setDeleting] = useState(false);
  const [showScroll, setShowScroll] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
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

  function autosize() {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 220)}px`;
  }

  function onScroll(event: React.UIEvent<HTMLDivElement>) {
    const element = event.currentTarget;
    setShowScroll(element.scrollHeight - element.scrollTop - element.clientHeight > 240);
  }

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
    if (textareaRef.current) textareaRef.current.style.height = "auto";
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

  function exportConversation() {
    try {
      const lines = [
        `# ${title}`,
        "",
        ...messages
          .filter((message) => !message.pending)
          .map(
            (message) =>
              `## ${message.role === "user" ? ar.app.chat.you : ar.appName}\n\n${message.content}`,
          ),
      ];
      const blob = new Blob([lines.join("\n\n")], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${title.replace(/[\\/:*?"<>|]/g, "").trim() || "conversation"}.md`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(ar.app.chat.exportFailed);
    }
  }

  async function deleteConversation() {
    try {
      await apiFetch(`/api/conversations/${conversationId}`, { method: "DELETE" });
      router.push("/app");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof ApiError ? deleteError.message : ar.app.sidebar.actionFailed);
      setDeleting(false);
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
  const isEmpty = messages.length === 0 && streamText === null;

  function renderAssistantAvatar() {
    return (
      <span
        aria-hidden="true"
        className="brand-gradient grid h-[30px] w-[30px] flex-none place-items-center rounded-[9px] shadow-2"
      >
        <BrandMark size={15} />
      </span>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-[var(--topbar-h)] flex-none items-center gap-1.5 border-b border-edge bg-bg px-3">
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
            className="min-h-9 flex-1 rounded-lg border border-accent bg-input px-3 py-1.5 text-sm text-ink outline-none"
            aria-label={ar.app.sidebar.rename}
          />
        ) : (
          <h1 className="min-w-0 flex-1 truncate px-1 text-sm font-semibold text-ink">{title}</h1>
        )}
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-hover hover:text-ink"
          onClick={() => {
            setRenameValue(title);
            setRenaming(true);
          }}
          aria-label={ar.app.sidebar.rename}
        >
          <Pencil size={15} aria-hidden />
        </button>
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-hover hover:text-ink"
          onClick={exportConversation}
          aria-label={ar.app.chat.export}
          title={ar.app.chat.export}
        >
          <Download size={15} aria-hidden />
        </button>
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-hover hover:text-danger"
          onClick={() => setDeleting(true)}
          aria-label={ar.app.sidebar.delete}
          title={ar.app.sidebar.delete}
        >
          <Trash2 size={15} aria-hidden />
        </button>
      </header>

      <div ref={scrollRef} onScroll={onScroll} className="relative min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full max-w-3xl flex-col px-4 py-8">
          {isEmpty ? (
            <div className="flex flex-1 flex-col items-center justify-center px-2 py-10 text-center">
              <span
                aria-hidden="true"
                className="brand-gradient mb-6 grid h-14 w-14 place-items-center rounded-2xl shadow-3"
              >
                <BrandMark size={26} />
              </span>
              <h2 className="mb-2.5 text-[26px] font-bold tracking-tight text-ink">
                {ar.app.chat.welcome}
              </h2>
              <p className="mb-8 max-w-md text-sm leading-relaxed text-ink-2">
                {ar.app.chat.emptyBody}
              </p>
              <p className="mb-3 w-full max-w-xl text-start text-[11px] font-bold tracking-[.08em] text-ink-4">
                {ar.app.chat.suggestionsTitle}
              </p>
              <div className="grid w-full max-w-xl grid-cols-1 gap-2.5 sm:grid-cols-2">
                {ar.app.chat.suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="rounded-xl border border-edge bg-surface p-3.5 text-start text-[13px] leading-snug text-ink-2 transition-all hover:-translate-y-0.5 hover:border-accent hover:bg-raised hover:text-ink"
                    onClick={() => {
                      setInput(suggestion);
                      textareaRef.current?.focus();
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((message, index) => {
            const isUser = message.role === "user";
            const isLastAssistant = index === lastAssistantIndex;
            return (
              <div key={message.id} className="msg-enter group flex gap-4 py-5">
                {isUser ? (
                  <span
                    aria-hidden="true"
                    className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[9px] border border-edge bg-raised text-ink-2"
                  >
                    <User size={15} aria-hidden />
                  </span>
                ) : (
                  renderAssistantAvatar()
                )}
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex min-h-[22px] items-center gap-2.5">
                    <span className="text-[13.5px] font-semibold text-ink">
                      {isUser ? ar.app.chat.you : ar.appName}
                    </span>
                    <span className="text-[11.5px] text-ink-3">
                      {formatTimeOnly(message.createdAt)}
                    </span>
                  </div>
                  {isUser ? (
                    <div className="whitespace-pre-wrap break-words rounded-xl border border-edge-soft bg-bubble px-4 py-3 text-[14.5px] leading-[1.6] text-ink">
                      {message.content}
                    </div>
                  ) : (
                    <div className="text-[14.5px] text-ink">
                      <Markdown content={message.content} />
                    </div>
                  )}
                  {!isUser && !message.pending ? (
                    <MessageActions
                      message={message}
                      isLastAssistant={isLastAssistant}
                      copiedId={copiedId}
                      savedId={savedId}
                      onCopy={() => void copyMessage(message)}
                      onSave={() => void saveToLibrary(message)}
                      onVote={(value) => void voteMessage(message, value)}
                      onRegenerate={() => void regenerate()}
                    />
                  ) : null}
                </div>
              </div>
            );
          })}

          {streamText !== null ? (
            <div className="msg-enter flex gap-4 py-5" aria-live="polite">
              {renderAssistantAvatar()}
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex min-h-[22px] items-center gap-2.5">
                  <span className="text-[13.5px] font-semibold text-ink">{ar.appName}</span>
                  <span className="inline-flex items-center gap-2 rounded-lg border border-edge bg-surface px-2.5 py-1 text-[12px] text-ink-3">
                    <span className="stream-dots" aria-hidden>
                      <i />
                      <i />
                      <i />
                    </span>
                    {ar.app.chat.thinking}
                  </span>
                </div>
                <div className="text-[14.5px] text-ink">
                  {streamText ? (
                    <>
                      <Markdown content={streamText} />
                      <span className="stream-cursor" aria-hidden />
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {showRetry ? (
            <div className="flex gap-4 py-5">
              {renderAssistantAvatar()}
              <div className="min-w-0 flex-1">
                <p className="mb-2 text-sm text-danger">{ar.app.chat.replyFailed}</p>
                <button
                  type="button"
                  onClick={() => void regenerate()}
                  className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-accent px-3 text-sm font-medium text-accent-ink"
                >
                  <RefreshCw size={14} aria-hidden />
                  {ar.app.chat.retry}
                </button>
              </div>
            </div>
          ) : null}

          {lastAssistant && lastAssistant.status === "error" && !showRetry ? (
            <p className="py-2 text-sm text-danger">{ar.app.chat.replyFailed}</p>
          ) : null}

          <div ref={bottomRef} />
        </div>

        {showScroll ? (
          <button
            type="button"
            onClick={() => bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" })}
            aria-label={ar.app.chat.scrollDown}
            className="absolute inset-x-0 bottom-6 mx-auto grid h-9 w-9 place-items-center rounded-full border border-edge bg-surface text-ink-2 shadow-2 transition-colors hover:bg-raised hover:text-ink"
          >
            <ArrowDown size={15} aria-hidden />
          </button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="mx-auto w-full max-w-3xl px-4 pb-1 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex-none bg-bg px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-edge bg-input transition-[border-color,box-shadow] focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-ring)]">
            <label className="sr-only" htmlFor="composer-input">
              {ar.app.chat.composerPlaceholder}
            </label>
            <textarea
              id="composer-input"
              ref={textareaRef}
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                autosize();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  void send();
                }
              }}
              rows={1}
              maxLength={MAX_INPUT_LENGTH}
              placeholder={ar.app.chat.composerPlaceholder}
              className="max-h-[220px] min-h-[52px] w-full resize-none bg-transparent px-4 pb-2 pt-3.5 text-[14.5px] leading-[1.55] text-ink outline-none placeholder:text-ink-3"
            />
            <div className="flex items-center justify-end px-2 pb-2">
              {sending ? (
                <button
                  type="button"
                  onClick={stop}
                  aria-label={ar.app.chat.stop}
                  title={ar.app.chat.stop}
                  className="grid h-[34px] w-[34px] place-items-center rounded-xl bg-danger text-white shadow-2 transition-[filter] hover:brightness-110"
                >
                  <Square size={13} fill="currentColor" aria-hidden />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={!input.trim()}
                  aria-label={ar.app.chat.send}
                  title={ar.app.chat.send}
                  className="grid h-[34px] w-[34px] place-items-center rounded-xl bg-accent text-accent-ink shadow-2 transition-[filter,opacity] hover:brightness-110 disabled:cursor-not-allowed disabled:bg-raised disabled:text-ink-4 disabled:shadow-none"
                >
                  <ArrowLeft size={16} aria-hidden />
                </button>
              )}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1 text-[11.5px] text-ink-3">
            <span>{ar.app.chat.composerDisclaimer}</span>
            <span>
              <kbd className="rounded border border-edge bg-raised px-1.5 py-px font-mono text-[10.5px]">
                Enter
              </kbd>{" "}
              {ar.app.chat.hintSend} ·{" "}
              <kbd className="rounded border border-edge bg-raised px-1.5 py-px font-mono text-[10.5px]">
                Shift
              </kbd>
              +
              <kbd className="rounded border border-edge bg-raised px-1.5 py-px font-mono text-[10.5px]">
                Enter
              </kbd>{" "}
              {ar.app.chat.hintNewLine}
            </span>
          </div>
        </div>
      </div>

      <Dialog
        open={deleting}
        title={ar.app.sidebar.deleteTitle}
        onClose={() => setDeleting(false)}
      >
        <p className="mb-4 text-sm text-ink-2">{ar.app.sidebar.deleteBody}</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="min-h-11 rounded-xl bg-danger px-4 font-medium text-white"
            onClick={() => void deleteConversation()}
          >
            {ar.common.delete}
          </button>
          <button
            type="button"
            className="min-h-11 rounded-xl border border-edge px-4 font-medium text-ink"
            onClick={() => setDeleting(false)}
          >
            {ar.common.cancel}
          </button>
        </div>
      </Dialog>
    </div>
  );
}
