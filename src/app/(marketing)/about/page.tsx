import type { Metadata } from "next";
import { ar } from "@/messages/ar";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata(
  "/about",
  ar.meta.about.title,
  ar.meta.about.description,
);

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-2xl font-bold">{ar.about.title}</h1>
      <p className="mb-8 text-ink-2">{ar.about.intro}</p>

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold">{ar.about.whoTitle}</h2>
        <p className="text-ink-2">{ar.about.whoBody}</p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold">{ar.about.notForTitle}</h2>
        <p className="text-ink-2">{ar.about.notForBody}</p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">{ar.about.focusTitle}</h2>
        <p className="text-ink-2">{ar.about.focusBody}</p>
      </section>
    </div>
  );
}
