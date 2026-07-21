"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { trackUserLoggedIn } from "@/lib/analytics/client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const loginCopy = {
  en: {
    accountPrompt: "No account yet?",
    emailNotConfirmed:
      "This email has not been confirmed, so Supabase is blocking login. For internal testing, turn off Confirm Email in Supabase or confirm the user manually in Authentication > Users.",
    invalidCredentials:
      "Email or password is incorrect. If you just registered and have not received a confirmation email, check the Confirm Email setting in Supabase.",
    missingFields: "Please enter email and password.",
    password: "Password",
    passwordPlaceholder: "Enter password",
    registerLink: "Create an account",
    rateLimit: "Supabase is rate-limiting login attempts. Please wait a moment and try again.",
    submit: "Log in",
    submitting: "Logging in...",
    redirecting: "Opening SaleMap...",
    unknown: "Could not log in right now. Please check the account or Supabase Auth settings.",
    unknownCatch: "Could not log in right now. Please try again later.",
  },
  vi: {
    accountPrompt: "Chưa có tài khoản?",
    emailNotConfirmed:
      "Email này chưa được xác nhận nên Supabase chưa cho đăng nhập. Khi test nội bộ, hãy tắt Confirm Email trong Supabase hoặc vào Authentication > Users để confirm user thủ công.",
    invalidCredentials:
      "Email hoặc mật khẩu chưa đúng. Nếu bạn vừa đăng ký nhưng chưa nhận mail xác nhận, hãy kiểm tra cài đặt Confirm Email trong Supabase.",
    missingFields: "Vui lòng nhập email và mật khẩu.",
    password: "Mật khẩu",
    passwordPlaceholder: "Nhập mật khẩu",
    registerLink: "Tạo tài khoản",
    rateLimit: "Supabase đang giới hạn số lần đăng nhập. Vui lòng chờ một lúc rồi thử lại.",
    submit: "Đăng nhập",
    submitting: "Đang đăng nhập...",
    redirecting: "Dang mo SaleMap...",
    unknown:
      "Không thể đăng nhập lúc này. Vui lòng kiểm tra lại tài khoản hoặc cài đặt Auth trong Supabase.",
    unknownCatch: "Không thể đăng nhập lúc này. Vui lòng thử lại sau.",
  },
} as const;

type LoginCopy = (typeof loginCopy)[keyof typeof loginCopy];

function inputClasses() {
  return "mt-2 min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-ink outline-none transition placeholder:text-slate-400 focus:border-ocean focus:ring-2 focus:ring-ocean/25 disabled:cursor-not-allowed disabled:bg-slate-50";
}

function getLoginErrorMessage(errorMessage: string, copy: LoginCopy) {
  const message = errorMessage.toLowerCase();

  if (message.includes("email not confirmed") || message.includes("not confirmed")) {
    return copy.emailNotConfirmed;
  }

  if (message.includes("invalid login credentials")) {
    return copy.invalidCredentials;
  }

  if (message.includes("rate limit")) {
    return copy.rateLimit;
  }

  return copy.unknown;
}

export function LoginForm() {
  const router = useRouter();
  const { locale } = useLanguage();
  const copy = loginCopy[locale];
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || isRedirecting) {
      return;
    }

    setError("");
    setIsSubmitting(true);
    setIsRedirecting(false);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError(copy.missingFields);
      setIsSubmitting(false);
      return;
    }

    let shouldKeepBusy = false;

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(getLoginErrorMessage(signInError.message, copy));
        return;
      }

      const user = signInData.user;

      const { data: profile } = user
        ? await supabase
            .from("user_profiles")
            .select("onboarding_completed")
            .eq("user_id", user.id)
            .maybeSingle()
        : { data: null };

      trackUserLoggedIn();
      shouldKeepBusy = true;
      setIsRedirecting(true);
      router.replace(profile?.onboarding_completed ? "/app/dashboard" : "/onboarding");
      router.refresh();
    } catch {
      setError(copy.unknownCatch);
    } finally {
      if (!shouldKeepBusy) {
        setIsSubmitting(false);
        setIsRedirecting(false);
      }
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="text-sm font-bold text-ink" htmlFor="login-email">
          Email
        </label>
        <input
          autoComplete="email"
          className={inputClasses()}
          disabled={isSubmitting || isRedirecting}
          id="login-email"
          name="email"
          placeholder="ban@email.com"
          type="email"
        />
      </div>

      <div>
        <label className="text-sm font-bold text-ink" htmlFor="login-password">
          {copy.password}
        </label>
        <input
          autoComplete="current-password"
          className={inputClasses()}
          disabled={isSubmitting || isRedirecting}
          id="login-password"
          name="password"
          placeholder={copy.passwordPlaceholder}
          type="password"
        />
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">
          {error}
        </div>
      ) : null}

      <button
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft transition hover:bg-[#5de0b3] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting || isRedirecting}
        type="submit"
      >
        {isRedirecting ? copy.redirecting : isSubmitting ? copy.submitting : copy.submit}
        <ArrowRight aria-hidden="true" className="h-5 w-5" />
      </button>

      <p className="text-center text-sm leading-6 text-slate-500">
        {copy.accountPrompt}{" "}
        <Link className="font-bold text-ocean hover:text-ink" href="/register">
          {copy.registerLink}
        </Link>
      </p>
    </form>
  );
}
