"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { ar } from "@/messages/ar";
import { apiFetch, ApiError } from "@/lib/api-client";
import { btnPrimary } from "@/components/ui/styles";

export function NewConversationButton({
  className,
  onCreated,
}: {
  className?: string;
  onCreated?: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setError(null);
    try {
      const data = await apiFetch<{ id: string }>("/api/conversations", {
        method: "POST",
        body: JSON.stringify({}),
      });
      onCreated?.();
      router.push(`/app/c/${data.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : ar.errors.serverError);
    }
  }

  return (
    <span className="flex flex-col gap-1">
      <button type="button" onClick={create} className={className ?? btnPrimary}>
        <Plus size={18} aria-hidden />
        {ar.app.sidebar.newConversation}
      </button>
      {error ? (
        <span role="alert" className="text-sm text-danger">
          {error}
        </span>
      ) : null}
    </span>
  );
}
