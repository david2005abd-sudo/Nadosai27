"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation/forms";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ar } from "@/messages/ar";
import { getBrowserSupabase } from "@/server/supabase/client";
import { btnPrimary, inputClass, labelClass } from "@/components/ui/styles";

type Stage = "checking" | "ready" | "invalid" | "done";

export function ResetPasswordForm() {
  const [stage, setStage] = useState<Stage>("checking");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function prepare() {
      try {
        const supabase = getBrowserSupabase();
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            if (!cancelled) setStage("invalid");
            return;
          }
        }
        const { data } = await supabase.auth.getSession();
        if (!cancelled) setStage(data.session ? "ready" : "invalid");
      } catch {
        if (!cancelled) setStage("invalid");
      }
    }
    void prepare();
    return () => {
      cancelled = true;
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(values: ResetPasswordInput) {
    setFormError(null);
    try {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) {
        setFormError(ar.auth.reset.generic);
        return;
      }
      await supabase.auth.signOut();
      setStage("done");
    } catch {
      setFormError(ar.errors.network);
    }
  }

  if (stage === "checking") {
    return <p className="text-ink-2">{ar.common.loading}</p>;
  }

  if (stage === "invalid") {
    return (
      <div className="rounded-xl border border-edge bg-surface p-6">
        <p role="alert" className="mb-4 text-sm text-danger">
          {ar.auth.reset.invalid}
        </p>
        <Link href="/forgot-password" className="text-link hover:underline">
          {ar.auth.forgot.title}
        </Link>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div className="rounded-xl border border-edge bg-surface p-6">
        <p role="status" className="mb-4 text-sm text-success">
          {ar.auth.reset.done}
        </p>
        <Link href="/login" className="text-link hover:underline">
          {ar.auth.login.title}
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-edge bg-surface p-6">
      <h1 className="mb-6 text-xl font-bold">{ar.auth.reset.title}</h1>
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
          <label htmlFor="reset-password" className={labelClass}>
            {ar.auth.reset.newPassword}
          </label>
          <input
            id="reset-password"
            type="password"
            dir="ltr"
            autoComplete="new-password"
            className={`${inputClass} text-start`}
            {...register("password")}
            aria-invalid={Boolean(errors.password)}
          />
          {errors.password ? (
            <p className="mt-1 text-sm text-danger">{errors.password.message}</p>
          ) : (
            <p className="mt-1 text-sm text-ink-2">{ar.auth.signup.passwordHint}</p>
          )}
        </div>
        <button type="submit" disabled={isSubmitting} className={btnPrimary}>
          {isSubmitting ? ar.common.loading : ar.auth.reset.submit}
        </button>
      </form>
    </div>
  );
}
