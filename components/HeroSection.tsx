"use client";

import { Bell, MapPin, PlusCircle, Route, Sparkles } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import {
  trackHeroCtaClicked,
  trackSecondaryCtaClicked,
} from "@/lib/analytics/client";

export function HeroSection() {
  const { dictionary } = useLanguage();
  const { common } = dictionary;
  const hero = dictionary.landing.hero;

  return (
    <section className="bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_58%,#eef8f4_100%)] px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
      <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[1.02fr_0.98fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-mint/30 bg-mint/10 px-3 py-2 text-sm font-semibold text-ocean">
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            {hero.eyebrow}
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight text-ink sm:text-5xl lg:text-5xl xl:text-[56px]">
            {hero.headline}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl sm:leading-9">
            {hero.subheadline}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              className="min-h-14 px-7 text-base"
              href="#dang-ky"
              onClick={trackHeroCtaClicked}
              size="lg"
              variant="accent"
            >
              {common.registerFree}
            </Button>
            <Button
              className="min-h-14 px-7 text-base"
              href="#cach-hoat-dong"
              onClick={trackSecondaryCtaClicked}
              size="lg"
              variant="secondary"
            >
              {common.viewHowItWorks}
            </Button>
          </div>
          <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-500 sm:text-base">
            {hero.microcopy}
          </p>
        </div>

        <div className="relative min-w-0">
          <div className="rounded-lg border border-slate-200 bg-white/70 p-2.5 shadow-[0_24px_70px_rgba(16,32,51,0.12)] backdrop-blur sm:p-3">
            <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
              <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-ocean">
                    SaleMap
                  </p>
                  <p className="mt-1 text-lg font-bold text-ink">{hero.mockupArea}</p>
                </div>
                <span className="inline-flex w-fit items-center gap-1 rounded-lg bg-mint/10 px-3 py-2 text-sm font-bold text-ocean">
                  <Bell aria-hidden="true" className="h-4 w-4" />
                  {hero.todayFollowup}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-cloud px-3 py-2.5">
                  <p className="text-[13px] font-semibold text-slate-500">
                    {hero.mockupSuggestion}
                  </p>
                  <p className="mt-1 text-base font-bold text-ink">{hero.results}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-cloud px-3 py-2.5">
                  <p className="text-[13px] font-semibold text-slate-500">
                    {hero.mockupUsage}
                  </p>
                  <p className="mt-1 text-base font-bold leading-6 text-ink">
                    {hero.limit}
                  </p>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-[#eaf3f1]">
                <div className="relative h-56">
                  <div className="absolute left-6 top-8 h-28 w-40 rounded-lg border border-white/80 bg-white/40" />
                  <div className="absolute bottom-6 right-6 h-24 w-36 rounded-lg border border-white/80 bg-white/50" />
                  <div className="absolute left-5 top-24 h-2 w-[72%] rotate-[-10deg] rounded-full bg-ocean/70" />
                  <div className="absolute left-16 top-16 flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-white shadow-soft">
                    <MapPin aria-hidden="true" className="h-5 w-5" />
                  </div>
                  <div className="absolute right-20 top-24 flex h-10 w-10 items-center justify-center rounded-lg bg-mint text-ink shadow-soft">
                    <Route aria-hidden="true" className="h-5 w-5" />
                  </div>
                  <div className="absolute bottom-10 left-28 flex h-10 w-10 items-center justify-center rounded-lg bg-white text-ocean shadow-soft">
                    <MapPin aria-hidden="true" className="h-5 w-5" />
                  </div>
                  <div className="absolute left-3 top-3 rounded-lg bg-white px-3 py-2 text-sm font-bold text-ocean shadow-soft sm:left-4 sm:top-4">
                    {hero.results}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-ink px-3 py-2 text-center text-sm font-bold text-white shadow-soft sm:bottom-4 sm:left-auto sm:right-4">
                    {hero.limit}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {hero.leadCards.map((lead) => (
                  <div
                    className="flex min-w-0 flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                    key={lead.name}
                  >
                    <div className="min-w-0">
                      <p className="text-base font-bold text-ink">{lead.name}</p>
                      <p className="mt-1 text-sm font-medium text-slate-500">{lead.area}</p>
                    </div>
                    <span className="w-fit rounded-lg bg-cloud px-3 py-1.5 text-sm font-bold text-ocean">
                      {lead.status}
                    </span>
                  </div>
                ))}
              </div>

              <button
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-mint px-4 py-3 text-base font-bold text-ink transition hover:bg-[#58d8aa]"
                type="button"
              >
                <PlusCircle aria-hidden="true" className="h-5 w-5" />
                {hero.saveLead}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
