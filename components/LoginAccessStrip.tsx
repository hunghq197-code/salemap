"use client";

import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export function LoginAccessStrip() {
  const { dictionary } = useLanguage();
  const loginStrip = dictionary.landing.loginStrip;

  return (
    <div className="border-b border-slate-200 bg-cloud/70 px-4 py-2.5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 text-sm font-semibold text-slate-600 sm:flex-row sm:items-center sm:justify-end">
        <span>{loginStrip.text}</span>
        <Link className="text-ocean underline-offset-4 hover:text-ink hover:underline" href="/login">
          {loginStrip.link}
        </Link>
      </div>
    </div>
  );
}
