"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { clearUserOfflineData } from "@/lib/offline/clear-user-offline-data";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const copyByLocale = {
  en: {
    confirm: "Confirm new password",
    error: "Could not update your password. Please request a new recovery link.",
    expired: "This recovery link is invalid or has expired.",
    mismatch: "The passwords do not match.",
    newPassword: "New password",
    passwordShort: "Use at least 8 characters.",
    requestAgain: "Request another recovery link",
    submit: "Update password",
    submitting: "Updating...",
    success: "Your password has been updated. You can now log in with the new password.",
    toLogin: "Log in",
    verifying: "Verifying recovery link...",
  },
  vi: {
    confirm: "Nhập lại mật khẩu mới",
    error: "Chưa thể cập nhật mật khẩu. Vui lòng yêu cầu một liên kết khôi phục mới.",
    expired: "Liên kết khôi phục không hợp lệ hoặc đã hết hạn.",
    mismatch: "Hai mật khẩu chưa trùng khớp.",
    newPassword: "Mật khẩu mới",
    passwordShort: "Mật khẩu cần có ít nhất 8 ký tự.",
    requestAgain: "Yêu cầu liên kết khôi phục mới",
    submit: "Cập nhật mật khẩu",
    submitting: "Đang cập nhật...",
    success: "Mật khẩu đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới.",
    toLogin: "Đăng nhập",
    verifying: "Đang xác minh liên kết khôi phục...",
  },
} as const;

export function UpdatePasswordForm() {
  const { locale } = useLanguage();
  const copy = copyByLocale[locale];
  const [error, setError] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifyRecoverySession() {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) {
          return;
        }

        if (!user) {
          setError(copy.expired);
        }
      } catch {
        if (active) {
          setError(copy.expired);
        }
      } finally {
        if (active) {
          setIsReady(true);
        }
      }
    }

    void verifyRecoverySession();

    return () => {
      active = false;
    };
  }, [copy.expired]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("confirmation") ?? "");

    if (password.length < 8) {
      setError(copy.passwordShort);
      return;
    }

    if (password !== confirmation) {
      setError(copy.mismatch);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(copy.error);
        return;
      }

      if (user?.id) {
        clearUserOfflineData(user.id);
      }

      await supabase.auth.signOut();
      setIsSuccess(true);
    } catch {
      setError(copy.error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isReady) {
    return <p className="text-sm font-semibold leading-6 text-slate-600">{copy.verifying}</p>;
  }

  if (isSuccess) {
    return (
      <div className="space-y-5">
        <div className="flex gap-3 rounded-lg border border-mint/60 bg-mint/10 px-4 py-4 text-sm font-semibold leading-6 text-ink">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 flex-none text-emerald-600" />
          <span>{copy.success}</span>
        </div>
        <Link
          className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft transition hover:bg-[#5de0b3]"
          href="/login"
        >
          {copy.toLogin}
        </Link>
      </div>
    );
  }

  if (error === copy.expired) {
    return (
      <div className="space-y-5">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">
          {error}
        </div>
        <Link
          className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft transition hover:bg-[#5de0b3]"
          href="/forgot-password"
        >
          {copy.requestAgain}
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="text-sm font-bold text-ink" htmlFor="new-password">
          {copy.newPassword}
        </label>
        <input
          autoComplete="new-password"
          className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-ink outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/25 disabled:bg-slate-50"
          disabled={isSubmitting}
          id="new-password"
          minLength={8}
          name="password"
          type="password"
        />
      </div>
      <div>
        <label className="text-sm font-bold text-ink" htmlFor="confirm-password">
          {copy.confirm}
        </label>
        <input
          autoComplete="new-password"
          className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-ink outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/25 disabled:bg-slate-50"
          disabled={isSubmitting}
          id="confirm-password"
          minLength={8}
          name="confirmation"
          type="password"
        />
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
    </form>
  );
}
