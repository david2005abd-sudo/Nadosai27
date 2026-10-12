"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { loginSchema, type LoginInput } from "@/lib/validation/forms";
import { ar } from "@/messages/ar";
import { getBrowserSupabase } from "@/server/supabase/client";
import { btnPrimary, inputClass, labelClass } from "@/components/ui/styles";

function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/app";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const callbackError = searchParams.get("error") === "callback";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    try {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) {
        if (error.message.toLowerCase().includes("not confirmed")) {
          setFormError(ar.auth.login.notConfirmed);
        } else if (error.status === 429) {
          setFormError(ar.auth.login.rateLimited);
        } else {
          setFormError(ar.auth.login.invalid);
        }
        return;
      }
      router.replace(safeNext(searchParams.get("next")));
      router.refresh();
    } catch {
      setFormError(ar.errors.network);
    }
  }

  return (
    <div className="rounded-xl border border-edge bg-surface p-6">
      <h1 className="mb-6 text-xl font-bold">{ar.auth.login.title}</h1>

      {callbackError ? (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-edge bg-raised p-3 text-sm text-danger"
        >
          {ar.auth.callback.invalid}
        </p>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        {formError ? (
          <p
            role="alert"
            className="rounded-lg border border-edge bg-raised p-3 text-sm text-danger"
          >
            {formError}
          </p>
        ) : null}

        <div>
          <label htmlFor="login-email" className={labelClass}>
            {ar.auth.login.email}
          </label>
          <input
            id="login-email"
            type="email"
            dir="ltr"
            autoComplete="email"
            className={`${inputClass} text-start`}
            {...register("email")}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email ? <p className="mt-1 text-sm text-danger">{errors.email.message}</p> : null}
        </div>

        <div>
          <label htmlFor="login-password" className={labelClass}>
            {ar.auth.login.password}
          </label>
          <input
            id="login-password"
            type="password"
            dir="ltr"
            autoComplete="current-password"
            className={`${inputClass} text-start`}
            {...register("password")}
            aria-invalid={Boolean(errors.password)}
          />
          {errors.password ? (
            <p className="mt-1 text-sm text-danger">{errors.password.message}</p>
          ) : null}
        </div>

        <button type="submit" disabled={isSubmitting} className={btnPrimary}>
          {isSubmitting ? ar.common.loading : ar.auth.login.submit}
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-2 text-sm text-ink-2">
        <Link href="/forgot-password" className="text-link hover:underline">
          {ar.auth.login.forgot}
        </Link>
        <p>
          {ar.auth.login.noAccount}{" "}
          <Link href="/signup" className="text-link hover:underline">
            {ar.auth.login.toSignup}
          </Link>
        </p>
      </div>
    </div>
  );
}
