"use client";

import { useEffect } from "react";
import { ar } from "@/messages/ar";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="text-center">
      <h1 className="mb-2 text-lg font-semibold">{ar.common.unexpectedError}</h1>
      <p className="mb-4 text-sm text-ink-2" dir="ltr">
        {error.message}
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex min-h-11 items-center rounded-lg bg-accent px-5 font-medium text-accent-ink"
      >
        {ar.common.retry}
      </button>
    </div>
  );
}
