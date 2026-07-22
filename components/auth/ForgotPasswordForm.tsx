"use client";

import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const copyByLocale = {
  en: {
    back: "Back to login",
    email: "Email",
    emailPlaceholder: "you@email.com",
    error: "Could not send the recovery email. Please wait a moment and try again.",
    missing: "Please enter your email.",
    submit: "Send recovery link",
    submitting: "Sending...",
    success:
      "If this email belongs to a SaleMap account, a password recovery link has been sent. Check your inbox and spam folder.",
  },
  vi: {
    back: "Quay lại đăng nhập",
    email: "Email",
    emailPlaceholder: "ban@email.com",
    error: "Chưa thể gửi email khôi phục. Vui lòng chờ một chút rồi thử lại.",
    missing: "Vui lòng nhập email.",
    submit: "Gửi liên kết khôi phục",
    submitting: "Đang gửi...",
    success:
      "Nếu email thuộc một tài khoản SaleMap, liên kết khôi phục mật khẩu đã được gửi. Hãy kiểm tra hộp thư đến và thư rác.",
  },
} as const;

export function ForgotPasswordForm() {
  const { locale } = useLanguage();
  const copy = copyByLocale[locale];
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    if (!email) {
      setError(copy.missing);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/update-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (resetError) {
        setError(copy.error);
        return;
      }

      setIsSubmitted(true);
    } catch {
      setError(copy.error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="space-y-5">
        <div className="rounded-lg border border-mint/60 bg-mint/10 px-4 py-4 text-sm font-semibold leading-6 text-ink">
          {copy.success}
        </div>
        <Link
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-base font-bold text-ink transition hover:border-ocean hover:text-ocean"
          href="/login"
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
          {copy.back}
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="text-sm font-bold text-ink" htmlFor="recovery-email">
          {copy.email}
        </label>
        <div className="relative mt-2">
          <Mail
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
          />
          <input
            autoComplete="email"
            className="min-h-12 w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-11 pr-3 text-base text-ink outline-none transition placeholder:text-slate-400 focus:border-ocean focus:ring-2 focus:ring-ocean/25 disabled:bg-slate-50"
            disabled={isSubmitting}
            id="recovery-email"
            name="email"
            placeholder={copy.emailPlaceholder}
            type="email"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">
          {error}
        </div>
      ) : null}

      <button
        className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft transition hover:bg-[#5de0b3] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? copy.submitting : copy.submit}
      </button>

      <Link
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 text-sm font-bold text-ocean hover:text-ink"
        href="/login"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        {copy.back}
      </Link>
    </form>
  );
}
