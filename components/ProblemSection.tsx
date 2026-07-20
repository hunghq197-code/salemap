"use client";

import { Clock, Compass, FileStack, SearchX } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const icons = [SearchX, Compass, FileStack, Clock] as const;

export function ProblemSection() {
  const { dictionary } = useLanguage();
  const problem = dictionary.landing.problem;

  return (
    <section className="bg-cloud px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            {problem.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            {problem.title}
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
            {problem.intro}
          </p>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {problem.points.map((point, index) => {
            const Icon = icons[index];

            return (
              <article
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_12px_34px_rgba(16,32,51,0.06)]"
                key={point.title}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-ocean/10 text-ocean">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold leading-7 text-ink">
                  {point.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {point.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
