"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import {
  trackInviteCodeRedeemed,
  trackInviteCodeValidated,
  trackInviteCodeValidationFailed,
  trackUserRegistered,
} from "@/lib/analytics/client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type BetaRegisterResponse = {
  error?: {
    code?: string;
    message?: string;
  };
  success?: boolean;
};

type InviteValidateResponse = {
  data?: {
    label?: string | null;
    valid?: boolean;
  };
  error?: {
    code?: string;
    message?: string;
  };
  success?: boolean;
};

type RegisterFormProps = {
  inviteOnly?: boolean;
};

const registerCopy = {
  en: {
    accountPrompt: "Already have an account?",
    betaNote:
      "Your account will be created for immediate login. Email confirmation will be re-enabled after SMTP is stable.",
    confirmPassword: "Confirm password",
    confirmPasswordPlaceholder: "Re-enter password",
    createError: "Could not create an account right now. Please try again later.",
    email: "Email",
    fullName: "Full name",
    fullNamePlaceholder: "Nguyen Van A",
    inviteHint: "You need a valid invite code to create an account.",
    inviteInvalid: "The invite code is invalid or has no uses left.",
    inviteLabel: "Invite code",
    inviteNote: " SaleMap is currently open by invite code.",
    invitePlaceholder: "Example: SALEMAP-INVITE-001",
    login: "Log in",
    loginAfterRegisterInvalid:
      "The account was created, but login did not complete. Please go back to the login page and try the password you just created.",
    loginAfterRegisterUnknown:
      "The account was created, but login did not complete. Please try logging in again.",
    missingFields: "Please fill in all required information.",
    password: "Password",
    passwordMismatch: "Password confirmation does not match.",
    passwordPlaceholder: "Minimum 8 characters",
    passwordTooShort: "Password must be at least 8 characters.",
    requiredInvite: "Please enter an invite code to create an account.",
    submit: "Create account and log in",
    submitting: "Creating account...",
    unknownCatch: "Could not register right now. Please try again later.",
  },
  vi: {
    accountPrompt: "Đã có tài khoản?",
    betaNote:
      "Tài khoản sẽ được tạo để đăng nhập ngay. Xác thực email sẽ bật lại sau khi cấu hình SMTP ổn định.",
    confirmPassword: "Nhập lại mật khẩu",
    confirmPasswordPlaceholder: "Nhập lại mật khẩu",
    createError: "Không thể tạo tài khoản lúc này. Vui lòng thử lại sau.",
    email: "Email",
    fullName: "Họ tên",
    fullNamePlaceholder: "Nguyễn Văn A",
    inviteHint: "Bạn cần mã mời hợp lệ để tạo tài khoản.",
    inviteInvalid: "Mã mời không hợp lệ hoặc đã hết lượt sử dụng.",
    inviteLabel: "Mã mời",
    inviteNote: " Hiện tại SaleMap đang mở đăng ký bằng mã mời.",
    invitePlaceholder: "Ví dụ: SALEMAP-INVITE-001",
    login: "Đăng nhập",
    loginAfterRegisterInvalid:
      "Tài khoản đã tạo nhưng chưa đăng nhập được. Vui lòng quay lại trang đăng nhập và thử lại đúng mật khẩu vừa tạo.",
    loginAfterRegisterUnknown:
      "Tài khoản đã tạo nhưng chưa đăng nhập được. Vui lòng thử đăng nhập lại.",
    missingFields: "Vui lòng nhập đầy đủ thông tin.",
    password: "Mật khẩu",
    passwordMismatch: "Mật khẩu xác nhận chưa khớp.",
    passwordPlaceholder: "Tối thiểu 8 ký tự",
    passwordTooShort: "Mật khẩu cần có ít nhất 8 ký tự.",
    requiredInvite: "Vui lòng nhập mã mời để tạo tài khoản.",
    submit: "Tạo tài khoản và đăng nhập",
    submitting: "Đang tạo tài khoản...",
    unknownCatch: "Không thể đăng ký lúc này. Vui lòng thử lại sau.",
  },
} as const;

function inputClasses() {
  return "mt-2 min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-ink outline-none transition placeholder:text-slate-400 focus:border-ocean focus:ring-2 focus:ring-ocean/25 disabled:cursor-not-allowed disabled:bg-slate-50";
}

function getApiErrorMessage(payload: BetaRegisterResponse, fallback: string) {
  if (payload.error?.message) {
    return payload.error.message;
  }

  return fallback;
}

function getLoginAfterRegisterErrorMessage(errorMessage: string, copy: (typeof registerCopy)[keyof typeof registerCopy]) {
  const message = errorMessage.toLowerCase();

  if (message.includes("invalid login credentials")) {
    return copy.loginAfterRegisterInvalid;
  }

  return copy.loginAfterRegisterUnknown;
}

export function RegisterForm({ inviteOnly = false }: RegisterFormProps) {
  const router = useRouter();
  const { locale } = useLanguage();
  const copy = registerCopy[locale];
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const inviteCode = String(formData.get("inviteCode") ?? "").trim().toUpperCase();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!fullName || !email || !password || !confirmPassword) {
      setError(copy.missingFields);
      setIsSubmitting(false);
      return;
    }

    if (inviteOnly && !inviteCode) {
      setError(copy.requiredInvite);
      setIsSubmitting(false);
      return;
    }

    if (password.length < 8) {
      setError(copy.passwordTooShort);
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(copy.passwordMismatch);
      setIsSubmitting(false);
      return;
    }

    try {
      if (inviteCode) {
        const inviteResponse = await fetch("/api/beta-invite/validate", {
          body: JSON.stringify({
            code: inviteCode,
            email,
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        });
        const inviteResult = (await inviteResponse.json()) as InviteValidateResponse;

        if (!inviteResponse.ok || !inviteResult.success || !inviteResult.data?.valid) {
          trackInviteCodeValidationFailed({
            errorCode: inviteResult.error?.code || "INVALID_INVITE_CODE",
            inviteOnly,
          });
          setError(inviteResult.error?.message || copy.inviteInvalid);
          return;
        }

        trackInviteCodeValidated({
          inviteOnly,
          label: inviteResult.data.label,
        });
      }

      const registerResponse = await fetch("/api/auth/beta-register", {
        body: JSON.stringify({
          email,
          fullName,
          inviteCode,
          password,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const registerResult = (await registerResponse.json()) as BetaRegisterResponse;

      if (!registerResponse.ok || !registerResult.success) {
        setError(getApiErrorMessage(registerResult, copy.createError));
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(getLoginAfterRegisterErrorMessage(signInError.message, copy));
        return;
      }

      trackUserRegistered();
      if (inviteCode) {
        trackInviteCodeRedeemed({ inviteOnly });
      }
      router.replace("/onboarding");
      router.refresh();
    } catch {
      setError(copy.unknownCatch);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="rounded-lg border border-ocean/15 bg-cloud px-4 py-3 text-sm font-semibold leading-6 text-slate-600">
        {copy.betaNote}
        {inviteOnly ? copy.inviteNote : ""}
      </div>

      <div>
        <label className="text-sm font-bold text-ink" htmlFor="register-name">
          {copy.fullName}
        </label>
        <input
          autoComplete="name"
          className={inputClasses()}
          disabled={isSubmitting}
          id="register-name"
          name="fullName"
          placeholder={copy.fullNamePlaceholder}
          type="text"
        />
      </div>

      <div>
        <label className="text-sm font-bold text-ink" htmlFor="register-email">
          {copy.email}
        </label>
        <input
          autoComplete="email"
          className={inputClasses()}
          disabled={isSubmitting}
          id="register-email"
          name="email"
          placeholder="ban@email.com"
          type="email"
        />
      </div>

      {inviteOnly ? (
        <div>
          <label className="text-sm font-bold text-ink" htmlFor="register-invite-code">
            {copy.inviteLabel} <span className="text-rose-600">*</span>
          </label>
          <input
            autoComplete="off"
            className={inputClasses()}
            disabled={isSubmitting}
            id="register-invite-code"
            name="inviteCode"
            placeholder={copy.invitePlaceholder}
            type="text"
          />
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {copy.inviteHint}
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="text-sm font-bold text-ink" htmlFor="register-password">
            {copy.password}
          </label>
          <input
            autoComplete="new-password"
            className={inputClasses()}
            disabled={isSubmitting}
            id="register-password"
            name="password"
            placeholder={copy.passwordPlaceholder}
            type="password"
          />
        </div>

        <div>
          <label
            className="text-sm font-bold text-ink"
            htmlFor="register-confirm-password"
          >
            {copy.confirmPassword}
          </label>
          <input
            autoComplete="new-password"
            className={inputClasses()}
            disabled={isSubmitting}
            id="register-confirm-password"
            name="confirmPassword"
            placeholder={copy.confirmPasswordPlaceholder}
            type="password"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">
          {error}
        </div>
      ) : null}

      <button
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft transition hover:bg-[#5de0b3] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? copy.submitting : copy.submit}
        <ArrowRight aria-hidden="true" className="h-5 w-5" />
      </button>

      <p className="text-center text-sm leading-6 text-slate-500">
        {copy.accountPrompt}{" "}
        <Link className="font-bold text-ocean hover:text-ink" href="/login">
          {copy.login}
        </Link>
      </p>
    </form>
  );
}
