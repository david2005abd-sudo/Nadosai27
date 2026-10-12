import { ar } from "@/messages/ar";

export default function MarketingLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16" role="status">
      <p className="text-ink-2">{ar.common.loading}</p>
    </div>
  );
}
