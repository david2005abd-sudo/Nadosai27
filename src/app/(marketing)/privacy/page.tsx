import type { Metadata } from "next";
import { ar } from "@/messages/ar";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata(
  "/privacy",
  ar.meta.privacy.title,
  ar.meta.privacy.description,
);

export default function PrivacyPage() {
  const sections = [
    { title: ar.privacy.s1Title, body: ar.privacy.s1Body },
    { title: ar.privacy.s2Title, body: ar.privacy.s2Body },
    { title: ar.privacy.s3Title, body: ar.privacy.s3Body },
    { title: ar.privacy.s4Title, body: ar.privacy.s4Body },
    { title: ar.privacy.s5Title, body: ar.privacy.s5Body },
  ];
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{ar.privacy.title}</h1>
        <span className="rounded-full border border-edge bg-raised px-3 py-1 text-xs text-ink-2">
          {ar.privacy.draft}
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
