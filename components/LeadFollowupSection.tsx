"use client";

import { CalendarDays, MessageSquareText, Tags } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export function LeadFollowupSection() {
  const { dictionary } = useLanguage();
  const leadFollowup = dictionary.landing.leadFollowup;
  const sampleLead = dictionary.landing.hero.leadCards[0];

  return (
    <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            {leadFollowup.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            {leadFollowup.title}
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            {leadFollowup.subtitle}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {leadFollowup.statuses.map((status) => (
              <span
                className="rounded-lg border border-slate-200 bg-cloud px-3 py-2 text-sm font-semibold text-slate-700"
                key={status}
              >
                {status}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-cloud p-4 shadow-soft">
          <div className="rounded-lg bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">{leadFollowup.cardLabel}</p>
                <h3 className="mt-1 text-xl font-bold text-ink">{sampleLead.name}</h3>
              </div>
              <span className="rounded-lg bg-mint/20 px-3 py-2 text-xs font-bold text-ocean">
                {leadFollowup.statuses[2]}
              </span>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex gap-3 rounded-lg border border-slate-200 p-4">
                <Tags aria-hidden="true" className="h-5 w-5 flex-none text-ocean" />
                <div>
                  <p className="text-sm font-bold text-ink">{leadFollowup.tagLabel}</p>
                  <p className="mt-1 text-sm text-slate-600">{leadFollowup.tag}</p>
                </div>
              </div>
              <div className="flex gap-3 rounded-lg border border-slate-200 p-4">
                <MessageSquareText
                  aria-hidden="true"
                  className="h-5 w-5 flex-none text-ocean"
                />
                <div>
                  <p className="text-sm font-bold text-ink">{leadFollowup.noteLabel}</p>
                  <p className="mt-1 text-sm text-slate-600">{leadFollowup.note}</p>
                </div>
              </div>
              <div className="flex gap-3 rounded-lg border border-slate-200 p-4">
                <CalendarDays
                  aria-hidden="true"
                  className="h-5 w-5 flex-none text-ocean"
                />
                <div>
                  <p className="text-sm font-bold text-ink">{leadFollowup.reminderLabel}</p>
                  <p className="mt-1 text-sm text-slate-600">{leadFollowup.reminder}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
