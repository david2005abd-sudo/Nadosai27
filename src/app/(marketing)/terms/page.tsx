import type { Metadata } from "next";
import { ar } from "@/messages/ar";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata(
  "/terms",
  ar.meta.terms.title,
  ar.meta.terms.description,
);

export default function TermsPage() {
  const sections = [
    { title: ar.terms.s1Title, body: ar.terms.s1Body },
    { title: ar.terms.s2Title, body: ar.terms.s2Body },
    { title: ar.terms.s3Title, body: ar.terms.s3Body },
    { title: ar.terms.s4Title, body: ar.terms.s4Body },
  ];
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{ar.terms.title}</h1>
        <span className="rounded-full border border-edge bg-raised px-3 py-1 text-xs text-ink-2">
          {ar.terms.draft}
        </span>
      </div>
      <div className="flex flex-col gap-6">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-1 text-lg font-semibold">{section.title}</h2>
            <p className="text-ink-2">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
