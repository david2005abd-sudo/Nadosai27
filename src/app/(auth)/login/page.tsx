import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { ar } from "@/messages/ar";

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-ink-2">{ar.common.loading}</p>}>
      <LoginForm />
    </Suspense>
  );
}
