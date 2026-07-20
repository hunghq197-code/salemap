"use client";

import { Globe2 } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { locales, type Locale } from "@/lib/i18n/dictionary";

const labels: Record<Locale, string> = {
  en: "EN",
  vi: "VI",
};

const ariaLabels: Record<Locale, string> = {
  en: "Switch to English",
  vi: "Switch to Vietnamese",
};

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      aria-label="Language"
      className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 text-sm font-bold text-slate-600 shadow-sm"
    >
      <Globe2 aria-hidden="true" className="ml-2 h-4 w-4 text-ocean" />
      {locales.map((item) => (
        <button
          aria-label={ariaLabels[item]}
          aria-pressed={locale === item}
          className={[
            "min-h-8 rounded-md px-2.5 transition",
            locale === item
              ? "bg-ink text-white"
              : "text-slate-500 hover:bg-cloud hover:text-ink",
          ].join(" ")}
          key={item}
          onClick={() => setLocale(item)}
          type="button"
        >
          {labels[item]}
        </button>
      ))}
    </div>
  );
}
