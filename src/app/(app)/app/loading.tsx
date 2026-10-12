import { ar } from "@/messages/ar";

export default function AppLoading() {
  return (
    <div className="flex flex-1 items-center justify-center p-8" role="status">
      <p className="text-ink-2">{ar.common.loading}</p>
    </div>
  );
}
