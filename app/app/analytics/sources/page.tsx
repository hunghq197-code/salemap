import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { calculateSourceBreakdownForUser } from "@/lib/analytics/sales-analytics";
import { ANALYTICS_PERIODS, type AnalyticsPeriodKey } from "@/lib/constants/sales-analytics";
import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import { analyticsPeriodSchema } from "@/lib/validators/sales-analytics";

export const dynamic = "force-dynamic";

type SourcesPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePeriod(searchParams?: SourcesPageProps["searchParams"]) {
  const parsed = analyticsPeriodSchema.safeParse({
    customFrom: getString(searchParams?.customFrom),
    customTo: getString(searchParams?.customTo),
    period: getString(searchParams?.period) || "this_month",
  });

  return parsed.success ? parsed.data : { period: "this_month" as AnalyticsPeriodKey };
}

export default async function SalesAnalyticsSourcesPage(props: SourcesPageProps) {
  const searchParams = await props.searchParams;
  const period = parsePeriod(searchParams);
  const { userId } = await createAuthedSupabaseServerClient();
  const sources = await calculateSourceBreakdownForUser(userId, period);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink shadow-sm hover:border-ocean"
        href="/app/analytics"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Quay lại hiệu quả bán hàng
      </Link>

      <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            Nguồn lead
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Hiệu quả theo nguồn
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            So sánh nguồn lead theo tổng lead, lead quan tâm, follow-up và số lead đã chốt.
          </p>
        </div>
      </div>

      <form className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm" method="get">
        <label className="text-sm font-bold text-ink">
          Khoảng thời gian
          <select
            className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15 sm:max-w-xs"
            defaultValue={period.period}
            name="period"
          >
            {Object.entries(ANALYTICS_PERIODS).map(([key, item]) => (
              <option key={key} value={key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <button
          className="mt-3 min-h-11 rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ocean"
          type="submit"
        >
          Xem nguồn
        </button>
      </form>

      <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-cloud text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Nguồn</th>
                <th className="px-4 py-3">Total leads</th>
                <th className="px-4 py-3">Interested</th>
                <th className="px-4 py-3">Follow-up</th>
                <th className="px-4 py-3">Won</th>
                <th className="px-4 py-3">Win rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sources.length > 0 ? (
                sources.map((source) => (
                  <tr key={source.source}>
                    <td className="px-4 py-3 font-bold text-ink">{source.label}</td>
                    <td className="px-4 py-3 text-slate-700">{source.totalLeads}</td>
                    <td className="px-4 py-3 text-slate-700">{source.interestedLeads}</td>
                    <td className="px-4 py-3 text-slate-700">{source.followUpLeads}</td>
                    <td className="px-4 py-3 text-slate-700">{source.wonLeads}</td>
                    <td className="px-4 py-3 text-slate-700">{source.winRate}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                    Chưa có dữ liệu nguồn lead trong kỳ này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
