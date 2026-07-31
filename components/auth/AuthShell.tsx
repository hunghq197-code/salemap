"use client";

import { CheckCircle2, MapPinned, Radar, Route, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { Badge } from "@/components/ui/Badge";

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
    <main className="min-h-screen bg-background px-4 py-6 text-text-primary sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <div className="flex items-center justify-between gap-4">
          <Link
            className="inline-flex min-h-11 items-center gap-2 text-xl font-bold text-text-primary"
            href="/"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-control bg-sidebar text-white shadow-soft">
              <MapPinned aria-hidden="true" className="h-5 w-5" />
            </span>
            SaleMap
          </Link>
          <LanguageSwitcher />
        </div>

        <div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[0.94fr_1.06fr] lg:py-10">
          <section className="relative overflow-hidden rounded-shell bg-sidebar p-6 text-white shadow-floating sm:p-8">
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:36px_36px]"
            />
            <div className="relative">
              <Badge tone="accent">{resolvedEyebrow}</Badge>
              <h1 className="mt-4 max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">
                {resolvedTitle}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
                {resolvedDescription}
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {[
                  { icon: Radar, label: "Quét khu vực" },
                  { icon: Route, label: "Theo tuyến đi" },
                  { icon: ShieldCheck, label: "Dữ liệu riêng" },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      className="rounded-card border border-white/10 bg-white/5 p-3"
                      key={item.label}
                    >
                      <Icon aria-hidden="true" className="h-5 w-5 text-accent" />
                      <p className="mt-2 text-sm font-bold text-white">{item.label}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-7 space-y-3">
                {fallbackHighlights[locale].map((item) => (
                  <div
                    className="flex gap-3 text-sm font-semibold leading-6 text-slate-200"
                    key={item}
                  >
                    <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 flex-none text-success" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-shell border border-border-soft bg-surface p-5 shadow-floating sm:p-7">
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
