"use client";

import { Check, Minus } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export function ComparisonSection() {
  const { dictionary } = useLanguage();
  const comparison = dictionary.landing.comparison;

  return (
    <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            {comparison.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            {comparison.title}
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:hidden">
          {comparison.rows.map((row) => {
            const isSaleMap = row.tool === "SaleMap";

            return (
              <article
                className={`rounded-lg border p-5 shadow-[0_12px_34px_rgba(16,32,51,0.06)] ${
                  isSaleMap
                    ? "border-mint/40 bg-mint/10"
                    : "border-slate-200 bg-white"
                }`}
                key={row.tool}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold text-ink">{row.tool}</h3>
                  <span
                    className={`inline-flex min-h-8 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold ${
                      isSaleMap
                        ? "bg-mint/20 text-ocean"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {isSaleMap ? (
                      <Check aria-hidden="true" className="h-4 w-4" />
                    ) : (
                      <Minus aria-hidden="true" className="h-4 w-4" />
                    )}
                    {isSaleMap ? comparison.badgeYes : comparison.badgeNo}
                  </span>
                </div>
                <p className="mt-3 text-base leading-8 text-slate-600">
                  {row.description}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-8 hidden overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_12px_34px_rgba(16,32,51,0.06)] md:block">
          <div className="overflow-x-auto">
            <table className="min-w-[720px] divide-y divide-slate-200 text-left">
              <thead className="bg-cloud">
                <tr>
                  <th className="px-5 py-4 text-sm font-bold text-ink">{comparison.toolHeader}</th>
                  <th className="px-5 py-4 text-sm font-bold text-ink">{comparison.fitHeader}</th>
                  <th className="px-5 py-4 text-sm font-bold text-ink">
                    {comparison.flowHeader}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {comparison.rows.map((row) => {
                  const isSaleMap = row.tool === "SaleMap";

                  return (
                    <tr className={isSaleMap ? "bg-mint/10" : "bg-white"} key={row.tool}>
                      <td className="px-5 py-5 align-top text-sm font-bold text-ink">
                        {row.tool}
                      </td>
                      <td className="px-5 py-5 align-top text-sm leading-7 text-slate-600">
                        {row.description}
                      </td>
                      <td className="px-5 py-5 align-top">
                        <span
                          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                            isSaleMap
                              ? "bg-mint/20 text-ocean"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {isSaleMap ? (
                            <Check aria-hidden="true" className="h-4 w-4" />
                          ) : (
                            <Minus aria-hidden="true" className="h-4 w-4" />
                          )}
                          {isSaleMap ? comparison.yes : comparison.no}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
