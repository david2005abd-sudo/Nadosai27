import { ar } from "@/messages/ar";

export default function AuthLoading() {
  return (
    <div className="rounded-xl border border-edge bg-surface p-6" role="status">
      <p className="text-ink-2">{ar.common.loading}</p>
    </div>
  );
}
