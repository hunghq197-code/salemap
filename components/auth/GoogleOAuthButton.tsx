"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type GoogleOAuthButtonProps = {
  disabled?: boolean;
  nextPath?: string;
  source: "login" | "register";
};

const googleCopy = {
  en: {
    configMissing:
      "Missing Supabase public config. Please set NEXT_PUBLIC_SUPABASE_URL and a public Supabase key.",
    error: "Could not start Google login right now. Please try again later.",
    label: "Continue with Google",
    redirecting: "Opening Google...",
  },
  vi: {
    configMissing:
      "Thiếu cấu hình Supabase public. Hãy kiểm tra NEXT_PUBLIC_SUPABASE_URL và public key.",
    error: "Chưa thể mở đăng nhập Google lúc này. Vui lòng thử lại sau.",
    label: "Tiếp tục với Google",
    redirecting: "Đang mở Google...",
  },
} as const;

function getUnexpectedOAuthErrorMessage(error: unknown, copy: (typeof googleCopy)[keyof typeof googleCopy]) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (
    message.includes("supabase public env") ||
    message.includes("next_public_supabase")
  ) {
    return copy.configMissing;
  }

  return copy.error;
}

function buildRedirectTo(source: GoogleOAuthButtonProps["source"], nextPath: string) {
  const callbackUrl = new URL("/auth/callback", window.location.origin);
  callbackUrl.searchParams.set("next", nextPath);
  callbackUrl.searchParams.set("provider", "google");
  callbackUrl.searchParams.set("source", source);

  return callbackUrl.toString();
}

export function GoogleOAuthButton({
  disabled = false,
  nextPath = "/app/dashboard",
  source,
}: GoogleOAuthButtonProps) {
  const { locale } = useLanguage();
  const copy = googleCopy[locale];
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDisabled = disabled || isSubmitting;

  async function handleClick() {
    if (isDisabled) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        options: {
          queryParams: {
            prompt: "select_account",
          },
          redirectTo: buildRedirectTo(source, nextPath),
        },
        provider: "google",
      });

      if (oauthError) {
        setError(copy.error);
        setIsSubmitting(false);
      }
    } catch (oauthError) {
      setError(getUnexpectedOAuthErrorMessage(oauthError, copy));
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        aria-label={copy.label}
        className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm transition hover:border-ocean hover:text-ocean disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isDisabled}
        onClick={handleClick}
        type="button"
      >
        <span
          aria-hidden="true"
          className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-black text-[#4285f4]"
        >
          G
        </span>
        <span>{isSubmitting ? copy.redirecting : copy.label}</span>
        {isSubmitting ? (
          <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
        ) : null}
      </button>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
