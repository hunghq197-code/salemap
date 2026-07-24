"use client";

import { CheckCircle2, MapPinned } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

type AuthScreen = "login" | "register";

type AuthShellProps = {
  children: ReactNode;
  description?: string;
  eyebrow?: string;
  screen?: AuthScreen;
  title?: string;
};

const fallbackHighlights = {
  en: [
    "Mobile-first workspace for daily sales work.",
    "Keep leads, notes, reminders, and sales tools in one place.",
    "Simple enough for field work, structured enough to follow up well.",
  ],
  vi: [
    "Workspace mobile-first cho công việc sale hằng ngày.",
    "Lead, ghi chú, nhắc việc và công cụ bán hàng nằm chung một nơi.",
    "Đủ gọn để dùng ngoài thị trường, đủ rõ để follow-up bài bản.",
  ],
} as const;

export function AuthShell({
  children,
  description,
  eyebrow,
  screen = "login",
  title,
}: AuthShellProps) {
  const { dictionary, locale } = useLanguage();
  const authCopy = dictionary.auth;
  const isLogin = screen === "login";
  const resolvedEyebrow = eyebrow ?? (isLogin ? authCopy.loginEyebrow : authCopy.registerEyebrow);
  const resolvedTitle = title ?? (isLogin ? authCopy.loginTitle : authCopy.registerTitle);
  const resolvedDescription =
    description ?? (isLogin ? authCopy.loginDescription : authCopy.registerDescription);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f5f8fb_46%,#eef8f4_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <div className="flex items-center justify-between gap-4">
          <Link
            className="inline-flex min-h-11 items-center gap-2 text-xl font-bold text-ink"
            href="/"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-white shadow-soft">
              <MapPinned aria-hidden="true" className="h-5 w-5" />
            </span>
            SaleMap
          </Link>
          <LanguageSwitcher />
        </div>

        <div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[0.92fr_1.08fr] lg:py-10">
          <section className="rounded-lg border border-slate-200/80 bg-white/70 p-5 shadow-[0_20px_60px_rgba(16,32,51,0.08)] backdrop-blur sm:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
              {resolvedEyebrow}
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight text-ink sm:text-5xl">
              {resolvedTitle}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              {resolvedDescription}
            </p>
            <div className="mt-7 space-y-3">
              {fallbackHighlights[locale].map((item) => (
                <div className="flex gap-3 text-sm font-semibold leading-6 text-slate-700" key={item}>
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 flex-none text-mint" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(16,32,51,0.10)] sm:p-7">
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
