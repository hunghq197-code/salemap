"use client";

import { CheckCircle2, MapPin, Navigation } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export function RouteHighlightSection() {
  const { dictionary } = useLanguage();
  const route = dictionary.landing.route;

  return (
    <section className="bg-cloud px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            {route.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            {route.title}
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            {route.subtitle}
          </p>
          <ul className="mt-6 space-y-3">
            {route.useCases.map((useCase) => (
              <li className="flex gap-3 text-sm leading-7 text-slate-700" key={useCase}>
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-1 h-5 w-5 flex-none text-mint"
                />
                <span>{useCase}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <div className="relative h-[360px] overflow-hidden rounded-lg bg-[#e9f3f7]">
            <div className="absolute left-6 top-8 h-20 w-32 rounded-lg bg-white/60" />
            <div className="absolute bottom-8 left-12 h-24 w-44 rounded-lg bg-white/60" />
            <div className="absolute right-10 top-14 h-28 w-40 rounded-lg bg-white/60" />
            <div className="absolute left-10 top-28 h-3 w-[76%] rotate-[18deg] rounded-full bg-ocean" />
            <div className="absolute left-24 top-28 h-3 w-[48%] rotate-[-18deg] rounded-full bg-mint" />
            <div className="absolute left-8 top-24 flex h-12 w-12 items-center justify-center rounded-lg bg-ink text-white shadow-soft">
              <MapPin aria-hidden="true" className="h-6 w-6" />
            </div>
            <div className="absolute right-12 top-48 flex h-12 w-12 items-center justify-center rounded-lg bg-mint text-ink shadow-soft">
              <Navigation aria-hidden="true" className="h-6 w-6" />
            </div>
            <div className="absolute bottom-12 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-lg bg-white text-ocean shadow-soft">
              <MapPin aria-hidden="true" className="h-6 w-6" />
            </div>
            <div className="absolute bottom-5 left-5 right-5 rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
              <p className="text-sm font-bold text-ink">{route.cardTitle}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {route.tags.map((item) => (
                  <span
                    className="rounded-lg bg-cloud px-3 py-2 text-center text-xs font-semibold text-ocean"
                    key={item}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
