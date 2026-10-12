"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { signupSchema, type SignupInput } from "@/lib/validation/forms";
import { ar } from "@/messages/ar";
import { getBrowserSupabase } from "@/server/supabase/client";
import { btnPrimary, inputClass, labelClass } from "@/components/ui/styles";

export function SignupForm() {
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(values: SignupInput) {
    setNotice(null);
    try {
      const supabase = getBrowserSupabase();
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { full_name: values.fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=%2Fapp`,
        },
      });
      if (error) {
        if (error.status === 429) setNotice(ar.auth.signup.rateLimited);
        else if (error.message.toLowerCase().includes("password"))
          setNotice(ar.auth.signup.weakPassword);
        else setNotice(ar.auth.signup.generic);
        return;
      }
      if (data.session) {
        router.replace("/app");
        router.refresh();
        return;
      }
      setNotice(ar.auth.signup.sent);
    } catch {
      setNotice(ar.errors.network);
    }
  }

  return (
    <div className="rounded-xl border border-edge bg-surface p-6">
      <h1 className="mb-6 text-xl font-bold">{ar.auth.signup.title}</h1>

      {notice ? (
        <p role="status" className="mb-4 rounded-lg border border-edge bg-raised p-3 text-sm">
          {notice}
        </p>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div>
          <label htmlFor="signup-name" className={labelClass}>
            {ar.auth.signup.fullName}
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            className={inputClass}
            {...register("fullName")}
            aria-invalid={Boolean(errors.fullName)}
          />
          {errors.fullName ? (
            <p className="mt-1 text-sm text-danger">{errors.fullName.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="signup-email" className={labelClass}>
            {ar.auth.signup.email}
          </label>
          <input
            id="signup-email"
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
          <label htmlFor="signup-password" className={labelClass}>
            {ar.auth.signup.password}
          </label>
          <input
            id="signup-password"
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
          {isSubmitting ? ar.common.loading : ar.auth.signup.submit}
        </button>
      </form>

      <p className="mt-4 text-sm text-ink-2">
        {ar.auth.signup.haveAccount}{" "}
        <Link href="/login" className="text-link hover:underline">
          {ar.auth.signup.toLogin}
        </Link>
      </p>
    </div>
  );
}
