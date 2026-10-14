"use client";

import { useRouter } from "next/navigation";
import { ar } from "@/messages/ar";
import { getBrowserSupabase } from "@/server/supabase/client";
import { btnIconBare } from "@/components/ui/styles";

export function SignOutButton({
  className,
  label,
}: {
  className?: string;
  label?: React.ReactNode;
}) {
  const router = useRouter();

  async function signOut() {
    try {
      const supabase = getBrowserSupabase();
      await supabase.auth.signOut();
    } catch {
      void 0;
    }
    router.replace("/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={signOut} className={className ?? btnIconBare}>
      {label ?? ar.common.signOut}
    </button>
  );
}
