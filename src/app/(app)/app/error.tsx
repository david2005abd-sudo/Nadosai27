"use client";

import { useEffect } from "react";
import { ar } from "@/messages/ar";

export default function AppError({
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
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-lg font-semibold">{ar.common.unexpectedError}</h1>
      <p className="text-sm text-ink-2" dir="ltr">
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
