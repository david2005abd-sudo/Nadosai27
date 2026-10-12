import Link from "next/link";
import { ar } from "@/messages/ar";

const navItems = [
  { href: "/", label: ar.nav.home },
  { href: "/about", label: ar.nav.about },
  { href: "/services", label: ar.nav.services },
  { href: "/faq", label: ar.nav.faq },
  { href: "/contact", label: ar.nav.contact },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-edge bg-surface">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="text-lg font-bold">
            {ar.appName}
          </Link>
          <nav aria-label={ar.nav.home} className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm text-ink-2 transition-colors hover:bg-raised hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-ink hover:bg-raised"
            >
              {ar.nav.login}
            </Link>
            <Link
              href="/signup"
              className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-ink hover:opacity-90"
            >
              {ar.nav.signup}
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-edge bg-surface">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-6 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-ink-2">{ar.marketing.footerNote}</p>
          <nav
            aria-label={ar.app.notFound.backHome}
            className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink-2"
          >
            <Link href="/privacy" className="hover:text-ink">
              {ar.nav.privacy}
            </Link>
            <Link href="/terms" className="hover:text-ink">
              {ar.nav.terms}
            </Link>
            <Link href="/faq" className="hover:text-ink">
              {ar.nav.faq}
            </Link>
            <Link href="/contact" className="hover:text-ink">
              {ar.nav.contact}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
