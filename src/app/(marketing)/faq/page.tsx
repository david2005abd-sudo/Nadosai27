import type { Metadata } from "next";
import { ar } from "@/messages/ar";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata(
  "/faq",
  ar.meta.faq.title,
  ar.meta.faq.description,
);

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ar.faq.items.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function FaqPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="mb-2 text-2xl font-bold">{ar.faq.title}</h1>
      <p className="mb-8 text-ink-2">{ar.faq.intro}</p>
      <div className="flex flex-col gap-3">
        {ar.faq.items.map((item) => (
          <section key={item.q} className="rounded-xl border border-edge bg-surface p-4">
            <h2 className="mb-1 font-semibold">{item.q}</h2>
            <p className="text-sm text-ink-2">{item.a}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
