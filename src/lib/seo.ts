import type { Metadata } from "next";
import { ar } from "@/messages/ar";

export function marketingMetadata(route: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: route },
    openGraph: {
      title,
      description,
      url: route,
      siteName: ar.appName,
      locale: "ar_IQ",
      type: "website",
    },
    twitter: { card: "summary", title, description },
  };
}
