"use client";

import { MapPinned } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

const supportLinkConfig = {
  "https://www.facebook.com/salemap.io.vn/": {
    className: "bg-[#1877F2] text-white hover:bg-[#0f66d6]",
    glyph: "f",
    glyphClassName: "text-2xl font-black",
  },
  "https://zalo.me/0963954197": {
    className: "bg-[#0068FF] text-white hover:bg-[#0057d6]",
    glyph: "Zalo",
    glyphClassName: "text-[11px] font-black",
  },
} as const;

function isExternalHref(href: string) {
  return href.startsWith("https://") || href.startsWith("http://");
}

function getSupportLinkConfig(href: string) {
  return supportLinkConfig[href as keyof typeof supportLinkConfig];
}

export function Footer() {
  const { dictionary } = useLanguage();
  const footer = dictionary.footer;
  const supportLinks = footer.links.filter((link) =>
    Boolean(getSupportLinkConfig(link.href)),
  );
  const textLinks = footer.links.filter(
    (link) => !getSupportLinkConfig(link.href),
  );

  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <Link
            className="inline-flex min-h-11 items-center gap-2 text-lg font-bold text-ink"
            href="/"
          >
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
        <div className="space-y-6">
          {supportLinks.length > 0 ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-ocean">
                Support
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {supportLinks.map((link) => {
                  const config = getSupportLinkConfig(link.href);

                  if (!config) return null;

                  return (
                    <Link
                      aria-label={link.label}
                      className={[
                        "inline-flex h-12 w-12 items-center justify-center rounded-full shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean",
                        config.className,
                      ].join(" ")}
                      href={link.href}
                      key={link.label}
                      rel="noopener noreferrer"
                      target="_blank"
                      title={link.label}
                    >
                      <span aria-hidden="true" className={config.glyphClassName}>
                        {config.glyph}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}
          <nav aria-label="Footer links" className="grid gap-3 sm:grid-cols-2">
            {textLinks.map((link) => (
              <Link
                className="inline-flex min-h-11 items-center text-sm font-medium text-slate-600 transition hover:text-ocean"
                href={link.href}
                key={link.label}
                rel={isExternalHref(link.href) ? "noopener noreferrer" : undefined}
                target={isExternalHref(link.href) ? "_blank" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
