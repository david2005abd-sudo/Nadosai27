"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { contactSchema, type ContactInput } from "@/lib/validation/forms";
import { ar } from "@/messages/ar";
import { btnPrimary, inputClass, labelClass } from "@/components/ui/styles";

export function ContactForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
  });

  async function onSubmit(values: ContactInput) {
    setMessage(null);
    setIsError(false);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data: { message?: string; error?: { message?: string } } = await response.json();
      if (!response.ok) {
        setIsError(true);
        setMessage(data.error?.message ?? ar.contact.error);
        return;
      }
      setMessage(data.message ?? ar.contact.successSaved);
    } catch {
      setIsError(true);
      setMessage(ar.errors.network);
    }
  }

  if (message && !isError) {
    return (
      <p role="status" className="rounded-xl border border-edge bg-surface p-4 text-success">
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {message && isError ? (
        <p role="alert" className="rounded-xl border border-edge bg-surface p-4 text-danger">
          {message}
        </p>
      ) : null}

      <div>
        <label htmlFor="contact-name" className={labelClass}>
          {ar.contact.name}
        </label>
        <input
          id="contact-name"
          type="text"
          className={inputClass}
          {...register("name")}
          aria-invalid={Boolean(errors.name)}
        />
        {errors.name ? <p className="mt-1 text-sm text-danger">{errors.name.message}</p> : null}
      </div>

      <div>
        <label htmlFor="contact-email" className={labelClass}>
          {ar.contact.email}
        </label>
        <input
          id="contact-email"
          type="email"
          dir="ltr"
          className={`${inputClass} text-start`}
          {...register("email")}
          aria-invalid={Boolean(errors.email)}
        />
        {errors.email ? <p className="mt-1 text-sm text-danger">{errors.email.message}</p> : null}
      </div>

      <div>
        <label htmlFor="contact-subject" className={labelClass}>
          {ar.contact.subject}
        </label>
        <input
          id="contact-subject"
          type="text"
          className={inputClass}
          {...register("subject")}
          aria-invalid={Boolean(errors.subject)}
        />
        {errors.subject ? (
          <p className="mt-1 text-sm text-danger">{errors.subject.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="contact-message" className={labelClass}>
          {ar.contact.message}
        </label>
        <textarea
          id="contact-message"
          rows={6}
          className={inputClass}
          {...register("message")}
          aria-invalid={Boolean(errors.message)}
        />
        {errors.message ? (
          <p className="mt-1 text-sm text-danger">{errors.message.message}</p>
        ) : null}
      </div>

      <div className="hidden" aria-hidden="true">
        <label htmlFor="contact-company">{ar.contact.honeypot}</label>
        <input
          id="contact-company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register("company")}
        />
      </div>

      <button type="submit" disabled={isSubmitting} className={`${btnPrimary} self-start`}>
        {isSubmitting ? ar.contact.submitting : ar.contact.submit}
      </button>
    </form>
  );
}
