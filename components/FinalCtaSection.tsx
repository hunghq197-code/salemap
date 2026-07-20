"use client";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import { trackFinalCtaClicked } from "@/lib/analytics/client";

export function FinalCtaSection() {
  const { dictionary } = useLanguage();
  const finalCta = dictionary.landing.finalCta;

  return (
    <section className="bg-ink px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mint">
            {finalCta.eyebrow}
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
            {finalCta.title}
          </h2>
        </div>
        <a
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-mint px-6 py-3 text-base font-semibold text-ink shadow-soft transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2 focus:ring-offset-ink"
          href="#dang-ky"
          onClick={trackFinalCtaClicked}
        >
          {dictionary.common.registerFree}
        </a>
      </div>
    </section>
  );
}
