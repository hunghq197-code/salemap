"use client";

import { MapPinned } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

export function Footer() {
  const { dictionary } = useLanguage();
  const footer = dictionary.footer;

  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <Link className="inline-flex items-center gap-2 text-lg font-bold text-ink" href="/">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-white">
              <MapPinned aria-hidden="true" className="h-5 w-5" />
            </span>
            SaleMap
          </Link>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
            {footer.description}
          </p>
          <div className="mt-5">
            <LanguageSwitcher />
          </div>
          <p className="mt-5 text-sm text-slate-500">
            © 2026 SaleMap. All rights reserved.
          </p>
        </div>
        <nav aria-label="Footer links" className="grid gap-3 sm:grid-cols-2">
          {footer.links.map((link) => (
            <Link
              className="text-sm font-medium text-slate-600 transition hover:text-ocean"
              href={link.href}
              key={link.label}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
