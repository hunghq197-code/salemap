"use client";

import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export function LoginAccessStrip() {
  const { dictionary } = useLanguage();
  const loginStrip = dictionary.landing.loginStrip;

  return (
    <div className="border-b border-slate-200 bg-cloud/70 px-4 py-2.5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 text-sm font-semibold text-slate-600 sm:justify-end">
        <span className="whitespace-nowrap">{loginStrip.text}</span>
        <Link
          className="inline-flex min-h-11 items-center whitespace-nowrap text-ocean underline-offset-4 hover:text-ink hover:underline"
          href="/login"
        >
          {loginStrip.link}
        </Link>
      </div>
    </div>
  );
}
