"use client";

import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { trackFAQOpened } from "@/lib/analytics/client";

export function FAQSection() {
  const { dictionary } = useLanguage();
  const faq = dictionary.landing.faq;

  return (
    <section className="scroll-mt-20 bg-white px-4 py-16 sm:px-6 lg:px-8" id="faq">
      <div className="mx-auto max-w-4xl">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            {faq.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            {faq.title}
          </h2>
        </div>
        <div className="mt-8 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white shadow-[0_12px_34px_rgba(16,32,51,0.06)]">
          {faq.items.map((item) => (
            <details
              className="group p-5"
              key={item.question}
              onToggle={(event) => {
                if (event.currentTarget.open) {
                  trackFAQOpened(item.question);
                }
              }}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-ink">
                <span>{item.question}</span>
                <ChevronDown
                  aria-hidden="true"
                  className="h-5 w-5 flex-none text-ocean transition group-open:rotate-180"
                />
              </summary>
              <p className="mt-4 text-sm leading-7 text-slate-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
