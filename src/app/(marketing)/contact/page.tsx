import type { Metadata } from "next";
import { ar } from "@/messages/ar";
import { marketingMetadata } from "@/lib/seo";
import { ContactForm } from "@/components/marketing/ContactForm";

export const metadata: Metadata = marketingMetadata(
  "/contact",
  ar.meta.contact.title,
  ar.meta.contact.description,
);

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12">
      <h1 className="mb-2 text-2xl font-bold">{ar.contact.title}</h1>
      <p className="mb-8 text-ink-2">{ar.contact.intro}</p>
      <ContactForm />
    </div>
  );
}
