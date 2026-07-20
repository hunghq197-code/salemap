"use client";

import { CalendarClock, ListPlus, SlidersHorizontal } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const icons = [SlidersHorizontal, ListPlus, CalendarClock] as const;

export function HowItWorksSection() {
  const { dictionary } = useLanguage();
  const how = dictionary.landing.how;

  return (
    <section
      className="scroll-mt-20 bg-cloud px-4 py-16 sm:px-6 lg:px-8"
      id="cach-hoat-dong"
    >
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            {how.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            {how.title}
          </h2>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {how.steps.map((step, index) => {
            const Icon = icons[index];

            return (
              <article
                className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_12px_34px_rgba(16,32,51,0.06)]"
                key={step.title}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-4xl font-bold text-ocean/20">
                    0{index + 1}
                  </span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-ink text-white">
                    <Icon aria-hidden="true" className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="mt-6 text-xl font-bold text-ink">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
