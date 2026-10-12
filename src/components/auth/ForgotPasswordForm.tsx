"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation/forms";
import { ar } from "@/messages/ar";
import { getBrowserSupabase } from "@/server/supabase/client";
import { btnPrimary, inputClass, labelClass } from "@/components/ui/styles";

export function ForgotPasswordForm() {
  const [notice, setNotice] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordInput) {
    setNotice(null);
    try {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });
      if (error) {
        setNotice(error.status === 429 ? ar.auth.forgot.rateLimited : ar.auth.forgot.generic);
        return;
      }
      setNotice(ar.auth.forgot.sent);
    } catch {
      setNotice(ar.errors.network);
    }
  }

  return (
    <div className="rounded-xl border border-edge bg-surface p-6">
      <h1 className="mb-2 text-xl font-bold">{ar.auth.forgot.title}</h1>
      <p className="mb-6 text-sm text-ink-2">{ar.auth.forgot.desc}</p>

      {notice ? (
        <p role="status" className="mb-4 rounded-lg border border-edge bg-raised p-3 text-sm">
          {notice}
        </p>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div>
          <label htmlFor="forgot-email" className={labelClass}>
            {ar.auth.forgot.email}
          </label>
          <input
            id="forgot-email"
            type="email"
            dir="ltr"
            autoComplete="email"
            className={`${inputClass} text-start`}
            {...register("email")}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email ? <p className="mt-1 text-sm text-danger">{errors.email.message}</p> : null}
        </div>

        <button type="submit" disabled={isSubmitting} className={btnPrimary}>
          {isSubmitting ? ar.common.loading : ar.auth.forgot.submit}
        </button>
      </form>
    </div>
  );
}
