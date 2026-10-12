"use client";

import { useEffect } from "react";
import { ar } from "@/messages/ar";

export default function RootError({
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
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">{ar.common.unexpectedError}</h1>
      <p className="text-ink-2" dir="ltr">
        {error.message}
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex min-h-11 items-center rounded-lg bg-accent px-5 font-medium text-accent-ink"
      >
        {ar.common.retry}
      </button>
    </main>
  );
}
