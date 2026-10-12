"use client";

import { useEffect } from "react";
import { ar } from "@/messages/ar";

export default function MarketingError({
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
    <div className="mx-auto w-full max-w-5xl px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">{ar.common.unexpectedError}</h1>
      <p className="mt-2 text-ink-2" dir="ltr">
        {error.message}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-accent px-5 font-medium text-accent-ink"
      >
        {ar.common.retry}
      </button>
    </div>
  );
}
