import type { Metadata } from "next";
import { ar } from "@/messages/ar";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata(
  "/services",
  ar.meta.services.title,
  ar.meta.services.description,
);

export default function ServicesPage() {
  const services = [
    { title: ar.services.chatTitle, body: ar.services.chatBody },
    { title: ar.services.historyTitle, body: ar.services.historyBody },
    { title: ar.services.limitsTitle, body: ar.services.limitsBody },
    { title: ar.services.keysTitle, body: ar.services.keysBody },
  ];
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-2xl font-bold">{ar.services.title}</h1>
      <p className="mb-8 text-ink-2">{ar.services.intro}</p>
      <div className="flex flex-col gap-4">
        {services.map((service) => (
          <section key={service.title} className="rounded-xl border border-edge bg-surface p-4">
            <h2 className="mb-1 font-semibold">{service.title}</h2>
            <p className="text-sm text-ink-2">{service.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
