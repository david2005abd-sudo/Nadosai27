import Link from "next/link";
import { ar } from "@/messages/ar";
import { requireUser } from "@/server/auth";
import { NewConversationButton } from "@/components/app/NewConversationButton";

export default async function AppHomePage() {
  const user = await requireUser();
  const name = user.profile.full_name ?? user.email ?? "";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">{ar.app.chat.welcome}</h1>
      {name ? <p className="text-ink-2">{name}</p> : null}
      <p className="max-w-md text-ink-2">{ar.app.chat.emptyBody}</p>
      <NewConversationButton />
      <Link href="/app/usage" className="text-sm text-link hover:underline">
        {ar.app.usage.title}
      </Link>
    </div>
  );
}
