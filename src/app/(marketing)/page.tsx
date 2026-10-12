import type { Metadata } from "next";
import Link from "next/link";
import { ar } from "@/messages/ar";
import { marketingMetadata } from "@/lib/seo";
import { btnPrimary } from "@/components/ui/styles";

export const metadata: Metadata = marketingMetadata(
  "/",
  ar.meta.home.title,
  ar.meta.home.description,
);

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: ar.appName,
      url: "/",
    },
    {
      "@type": "WebSite",
      name: ar.appName,
      url: "/",
      inLanguage: "ar",
    },
    {
      "@type": "SoftwareApplication",
      name: ar.appName,
      applicationCategory: "CommunicationApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "IQD" },
      inLanguage: "ar",
    },
  ],
};

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="flex flex-col items-start gap-4 py-14 md:py-20">
        <h1 className="max-w-2xl text-3xl font-bold leading-snug md:text-4xl">
          {ar.marketing.heroTitle}
        </h1>
        <p className="max-w-xl text-ink-2">{ar.marketing.heroDescription}</p>
        <Link href="/signup" className={btnPrimary}>
          {ar.marketing.ctaSignup}
        </Link>
      </section>

      <section aria-label={ar.marketing.previewTitle} className="py-8">
        <h2 className="mb-4 text-lg font-semibold">{ar.marketing.previewTitle}</h2>
        <div className="rounded-xl border border-edge bg-surface p-4">
          <div className="flex flex-col gap-3">
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-ts-sm border border-edge bg-raised px-4 py-2 text-sm">
                {ar.marketing.previewQuestion}
              </div>
            </div>
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-te-sm bg-accent/10 px-4 py-2 text-sm">
                <p>{ar.marketing.previewAnswer.split("\n\n")[0]}</p>
                <pre
                  dir="ltr"
                  className="mt-2 overflow-x-auto rounded-lg border border-edge bg-raised p-3 text-left font-mono text-xs"
                >
                  {"الدولة: العراق\nالعاصمة: بغداد\nالنهر: دجلة"}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-label={ar.marketing.stepsTitle} className="py-8">
        <h2 className="mb-4 text-lg font-semibold">{ar.marketing.stepsTitle}</h2>
        <ol className="flex flex-col gap-4 md:flex-row">
          {[
            { title: ar.marketing.step1Title, body: ar.marketing.step1Body },
            { title: ar.marketing.step2Title, body: ar.marketing.step2Body },
            { title: ar.marketing.step3Title, body: ar.marketing.step3Body },
          ].map((step, index) => (
            <li key={step.title} className="flex-1 rounded-xl border border-edge bg-surface p-4">
              <p className="mb-1 text-sm font-semibold text-accent">{String(index + 1)}</p>
              <h3 className="mb-1 font-semibold">{step.title}</h3>
              <p className="text-sm text-ink-2">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label={ar.marketing.limitsTitle} className="py-8">
        <h2 className="mb-4 text-lg font-semibold">{ar.marketing.limitsTitle}</h2>
        <ul className="flex flex-col gap-2">
          {[ar.marketing.limit1, ar.marketing.limit2, ar.marketing.limit3, ar.marketing.limit4].map(
            (limit) => (
              <li key={limit} className="flex items-start gap-2 text-sm text-ink-2">
                <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {limit}
              </li>
            ),
          )}
        </ul>
        <p className="mt-2 text-sm text-ink-2">{ar.marketing.limitsNote}</p>
      </section>

      <section aria-label={ar.marketing.faqTitle} className="py-8">
        <h2 className="mb-4 text-lg font-semibold">{ar.marketing.faqTitle}</h2>
        <div className="flex flex-col gap-3">
          {ar.faq.items.map((item) => (
            <details key={item.q} className="rounded-xl border border-edge bg-surface p-4">
              <summary className="cursor-pointer font-medium">{item.q}</summary>
              <p className="mt-2 text-sm text-ink-2">{item.a}</p>
            </details>
          ))}
        </div>
        <Link href="/faq" className="mt-4 inline-block text-sm text-link hover:underline">
          {ar.marketing.faqMore}
        </Link>
      </section>
    </div>
  );
}
