"use client";

import {
  BellRing,
  ClipboardList,
  Download,
  FileText,
  MapPin,
  MapPinned,
  PencilLine,
  Route,
} from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const icons = [
  MapPin,
  MapPinned,
  Route,
  ClipboardList,
  PencilLine,
  BellRing,
  FileText,
  Download,
] as const;

export function FeaturesSection() {
  const { dictionary } = useLanguage();
  const features = dictionary.landing.features;

  return (
    <section
      className="scroll-mt-20 bg-white px-4 py-16 sm:px-6 lg:px-8"
      id="tinh-nang"
    >
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            {features.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            {features.title}
          </h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.items.map((feature, index) => {
            const Icon = icons[index];

            return (
              <article
                className="flex min-h-32 flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-[0_12px_34px_rgba(16,32,51,0.06)]"
                key={feature}
              >
                <Icon aria-hidden="true" className="h-6 w-6 text-ocean" />
                <h3 className="mt-5 text-base font-bold leading-6 text-ink">{feature}</h3>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
