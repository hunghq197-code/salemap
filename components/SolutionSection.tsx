"use client";

import { BellRing, Map, Route, UserRoundCheck } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const icons = [Map, Route, UserRoundCheck, BellRing] as const;

export function SolutionSection() {
  const { dictionary } = useLanguage();
  const solution = dictionary.landing.solution;

  return (
    <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            {solution.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            {solution.title}
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {solution.cards.map((card, index) => {
            const Icon = icons[index];

            return (
              <article
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_12px_34px_rgba(16,32,51,0.06)] transition hover:-translate-y-1 hover:shadow-soft"
                key={card.title}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-mint/20 text-ocean">
                  <Icon aria-hidden="true" className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-ink">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{card.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
