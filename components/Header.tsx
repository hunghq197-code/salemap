"use client";

import { MapPinned, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { Button } from "@/components/ui/Button";
import { trackHeroCtaClicked } from "@/lib/analytics/client";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { dictionary } = useLanguage();
  const { common } = dictionary;
  const navigationLinks = dictionary.landing.nav;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 shadow-[0_12px_32px_rgba(16,32,51,0.06)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <Link
          className="inline-flex min-h-11 items-center gap-2.5 text-xl font-bold text-ink"
          href="/"
          onClick={() => setIsOpen(false)}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-white">
            <MapPinned aria-hidden="true" className="h-5 w-5" />
          </span>
          SaleMap
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-7 lg:flex">
          {navigationLinks.map((link) => (
            <Link
              className="text-[15px] font-bold text-slate-600 transition hover:text-ocean"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-cloud hover:text-ocean"
            href="/login"
          >
            {common.login}
          </Link>
          <Button
            className="px-5"
            href="/#dang-ky"
            onClick={trackHeroCtaClicked}
            size="md"
            variant="accent"
          >
            {common.registerBeta}
          </Button>
        </div>

        <button
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-ink transition hover:border-ocean hover:text-ocean md:hidden"
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          {isOpen ? (
            <X aria-hidden="true" className="h-5 w-5" />
          ) : (
            <Menu aria-hidden="true" className="h-5 w-5" />
          )}
        </button>
      </div>

      {isOpen ? (
        <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-soft md:hidden">
          <nav aria-label="Mobile navigation" className="mx-auto flex max-w-6xl flex-col gap-2">
            <LanguageSwitcher />
            {navigationLinks.map((link) => (
              <Link
                className="rounded-lg px-3 py-3.5 text-base font-semibold text-slate-700 transition hover:bg-cloud hover:text-ocean"
                href={link.href}
                key={link.href}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              className="rounded-lg px-3 py-3.5 text-base font-semibold text-slate-700 transition hover:bg-cloud hover:text-ocean"
              href="/login"
              onClick={() => setIsOpen(false)}
            >
              {common.login}
            </Link>
            <Link
              className="mt-2 inline-flex min-h-12 items-center justify-center rounded-lg bg-mint px-4 py-3 text-base font-bold text-ink shadow-soft transition hover:bg-[#5de0b3]"
              href="/#dang-ky"
              onClick={() => {
                trackHeroCtaClicked();
                setIsOpen(false);
              }}
            >
              {common.registerBeta}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
