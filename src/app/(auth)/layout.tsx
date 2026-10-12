import type { Metadata } from "next";
import Link from "next/link";
import { ar } from "@/messages/ar";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: ar.appName,
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-edge bg-surface">
        <div className="mx-auto flex w-full max-w-5xl items-center px-4 py-3">
          <Link href="/" className="text-lg font-bold">
            {ar.appName}
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
