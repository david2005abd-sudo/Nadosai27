import Link from "next/link";
import { ar } from "@/messages/ar";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-5xl font-semibold">404</p>
      <h1 className="text-xl font-semibold">{ar.app.notFound.title}</h1>
      <p className="text-ink-2">{ar.app.notFound.desc}</p>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center rounded-lg bg-accent px-5 font-medium text-accent-ink"
      >
        {ar.app.notFound.backHome}
      </Link>
    </main>
  );
}
