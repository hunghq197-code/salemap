import {
  BarChart3,
  Bot,
  CheckCircle2,
  Download,
  RefreshCw,
  Route,
  Target,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { rebuildSalesAnalyticsAction } from "@/app/app/analytics/actions";
import { Toast } from "@/components/ui/Toast";
import {
  calculateCategoryBreakdownForUser,
  calculateDailyTrendForUser,
  calculatePipelineFunnelForUser,
  calculateSalesMetricsForUser,
  calculateSourceBreakdownForUser,
  calculateTagBreakdownForUser,
} from "@/lib/analytics/sales-analytics";
import {
  ANALYTICS_PERIODS,
  getMetricLabel,
  type AnalyticsPeriodKey,
} from "@/lib/constants/sales-analytics";
import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import { getFilteredLeadCount } from "@/lib/data/lead-filtered-list";
import { getPinnedSalesGoals } from "@/lib/data/sales-goals";
import { analyticsPeriodSchema } from "@/lib/validators/sales-analytics";

export const dynamic = "force-dynamic";

type AnalyticsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePeriod(searchParams?: AnalyticsPageProps["searchParams"]) {
  const parsed = analyticsPeriodSchema.safeParse({
    customFrom: getString(searchParams?.customFrom),
    customTo: getString(searchParams?.customTo),
    period: getString(searchParams?.period) || "last_7_days",
  });

  return parsed.success ? parsed.data : { period: "last_7_days" as AnalyticsPeriodKey };
}

function KpiCard({
  helper,
  icon: Icon,
  label,
  suffix,
  value,
}: {
  helper: string;
  icon: typeof UsersRound;
  label: string;
  suffix?: string;
  value: number | string;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-500">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-mint/15 text-ocean">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold text-ink">
        {value}
        {suffix ? <span className="text-xl">{suffix}</span> : null}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{helper}</p>
    </article>
  );
}

function EmptyAnalyticsState() {
  return (
    <section className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-6 text-base leading-7 text-slate-600">
      Bạn chưa có đủ dữ liệu để xem hiệu suất. Hãy tạo lead, ghi chú và follow-up để SaleMap bắt đầu thống kê.
    </section>
  );
}

export default async function SalesAnalyticsPage(props: AnalyticsPageProps) {
  const searchParams = await props.searchParams;
  const period = parsePeriod(searchParams);
  const { userId } = await createAuthedSupabaseServerClient();
  const [
    summary,
    funnel,
    sources,
    tags,
    categories,
    trends,
    pinnedGoals,
    noFollowupCount,
  ] = await Promise.all([
    calculateSalesMetricsForUser(userId, period),
    calculatePipelineFunnelForUser(userId, period),
    calculateSourceBreakdownForUser(userId, period),
    calculateTagBreakdownForUser(userId, period),
    calculateCategoryBreakdownForUser(userId, period),
    calculateDailyTrendForUser(userId, period.period === "today" ? "last_7_days" : period),
    getPinnedSalesGoals(),
    getFilteredLeadCount({ noFollowUp: true }).catch(() => 0),
  ]);
  const metrics = summary.metrics;
  const hasData =
    metrics.leads_created +
      metrics.lead_notes_created +
      metrics.followups_created +
      metrics.pipeline_status_changes >
    0;
  const maxFunnel = Math.max(1, ...funnel.stages.map((stage) => stage.count));
  const maxTrend = Math.max(
    1,
    ...trends.map((item) => item.leadsCreated + item.followupsCompleted + item.leadsWon),
  );
  const bestSource = sources[0];

  return (
    <div className="mx-auto max-w-7xl">
      <Toast code={getString(searchParams?.toast)} />
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            Analytics
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Hiệu suất bán hàng cá nhân
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Theo dõi hoạt động sale, pipeline, follow-up và mục tiêu của bạn theo từng giai đoạn.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm hover:border-ocean"
            href="/app/analytics/goals"
          >
            <Target aria-hidden="true" className="h-5 w-5" />
            Mục tiêu
          </Link>
          <form action={rebuildSalesAnalyticsAction}>
            <button
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm hover:border-ocean"
              type="submit"
            >
              <RefreshCw aria-hidden="true" className="h-5 w-5" />
              Cập nhật số liệu
            </button>
          </form>
        </div>
      </div>

      <form className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm" method="get">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <label className="text-sm font-bold text-ink">
            Khoảng thời gian
            <select
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
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
          <label className="text-sm font-bold text-ink">
            Từ ngày
            <input
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              defaultValue={period.customFrom}
              name="customFrom"
              type="date"
            />
          </label>
          <label className="text-sm font-bold text-ink">
            Đến ngày
            <input
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              defaultValue={period.customTo}
              name="customTo"
              type="date"
            />
          </label>
          <button
            className="min-h-12 self-end rounded-lg bg-ink px-5 py-3 text-base font-bold text-white hover:bg-ocean"
            type="submit"
          >
            Xem
          </button>
        </div>
      </form>

      {!hasData ? <EmptyAnalyticsState /> : null}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          helper="Lead được tạo trong kỳ đang xem."
          icon={UsersRound}
          label="Lead mới"
          value={metrics.leads_created}
        />
        <KpiCard
          helper={`Contact rate ${summary.rates.contactRate}%.`}
          icon={CheckCircle2}
          label="Đã liên hệ"
          value={metrics.leads_contacted}
        />
        <KpiCard
          helper="Follow-up đã chuyển sang hoàn thành."
          icon={Target}
          label="Follow-up hoàn thành"
          value={metrics.followups_completed}
        />
        <KpiCard
          helper="Lead đang ở nhóm quan tâm hoặc follow-up."
          icon={BarChart3}
          label="Tỉ lệ chốt cơ bản"
          suffix="%"
          value={summary.rates.winRate}
        />
        <KpiCard
          helper="Lead won trong kỳ."
          icon={CheckCircle2}
          label="Đã chốt"
          value={metrics.leads_won}
        />
        <KpiCard
          helper="Số lần tìm khách dọc tuyến."
          icon={Route}
          label="Route searches"
          value={metrics.route_searches}
        />
        <KpiCard
          helper="Số lượt AI hoàn thành."
          icon={Bot}
          label="AI requests"
          value={metrics.ai_requests}
        />
        <KpiCard
          helper="Export CSV hoàn thành."
          icon={Download}
          label="Exports"
          value={metrics.exports_completed}
        />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-ink">Pipeline funnel</h2>
          <div className="mt-5 space-y-4">
            {funnel.stages.map((stage) => (
              <div key={stage.key}>
                <div className="flex items-center justify-between gap-3 text-sm font-bold text-ink">
                  <span>{stage.label}</span>
                  <span>{stage.count}</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-ocean"
                    style={{ width: `${Math.max(4, (stage.count / maxFunnel) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 text-sm font-semibold text-slate-600 sm:grid-cols-2">
            <p>New → Contacted: {funnel.conversionRates.newToContacted}%</p>
            <p>Contacted → Interested: {funnel.conversionRates.contactedToInterested}%</p>
            <p>Interested → Follow-up: {funnel.conversionRates.interestedToFollowUp}%</p>
            <p>Follow-up → Won: {funnel.conversionRates.followUpToWon}%</p>
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-ink">Insight hôm nay</h2>
          <div className="mt-4 space-y-3 text-base leading-7 text-slate-600">
            <p>Bạn có {metrics.overdue_followups} follow-up quá hạn.</p>
            <p>
              Nguồn lead hiệu quả nhất hiện tại:{" "}
              <span className="font-bold text-ink">{bestSource?.label ?? "Chưa đủ dữ liệu"}</span>.
            </p>
            <p>Bạn đã active {metrics.active_days_7d}/7 ngày gần nhất.</p>
            <p>Bạn có {noFollowupCount} lead chưa có lịch follow-up.</p>
          </div>
          <div className="mt-5 rounded-lg bg-cloud p-4">
            <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
              Mục tiêu đang ghim
            </h3>
            {pinnedGoals.items.length > 0 ? (
              <div className="mt-3 space-y-3">
                {pinnedGoals.items.slice(0, 3).map((goal) => (
                  <Link
                    className="block rounded-lg bg-white p-3 shadow-sm hover:ring-2 hover:ring-ocean/15"
                    href="/app/analytics/goals"
                    key={goal.id}
                  >
                    <div className="flex items-center justify-between gap-3 text-sm font-bold text-ink">
                      <span>{goal.name}</span>
                      <span>{goal.progress.progressPercent}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-mint"
                        style={{ width: `${goal.progress.progressPercent}%` }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-lg bg-white p-4">
                <p className="text-sm leading-6 text-slate-600">
                  Đặt mục tiêu đầu tiên để theo dõi tiến độ đều hơn.
                </p>
                <Link
                  className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg bg-mint px-4 py-2 text-sm font-bold text-ink"
                  href="/app/analytics/goals/new"
                >
                  Tạo mục tiêu
                </Link>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-ink">Lịch sử hoạt động theo ngày</h2>
          <p className="text-sm font-semibold text-slate-500">
            Lead mới, follow-up hoàn thành và lead won.
          </p>
        </div>
        <div className="mt-5 grid gap-3">
          {trends.map((item) => {
            const total = item.leadsCreated + item.followupsCompleted + item.leadsWon;
            return (
              <div className="grid gap-2 sm:grid-cols-[120px_1fr_160px]" key={item.date}>
                <p className="text-sm font-bold text-slate-600">{item.date}</p>
                <div className="h-8 overflow-hidden rounded-lg bg-slate-100">
                  <div
                    className="h-full rounded-lg bg-mint"
                    style={{ width: `${Math.max(3, (total / maxTrend) * 100)}%` }}
                  />
                </div>
                <p className="text-sm font-semibold text-slate-500">
                  {item.leadsCreated} lead · {item.followupsCompleted} follow-up · {item.leadsWon} won
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-ink">Nguồn lead hiệu quả</h2>
            <Link className="text-sm font-bold text-ocean hover:text-ink" href="/app/analytics/sources">
              Xem chi tiết
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Nguồn</th>
                  <th className="py-3 pr-4">Lead</th>
                  <th className="py-3 pr-4">Quan tâm</th>
                  <th className="py-3 pr-4">Won</th>
                  <th className="py-3">Win rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sources.slice(0, 6).map((source) => (
                  <tr key={source.source}>
                    <td className="py-3 pr-4 font-bold text-ink">{source.label}</td>
                    <td className="py-3 pr-4 text-slate-600">{source.totalLeads}</td>
                    <td className="py-3 pr-4 text-slate-600">{source.interestedLeads}</td>
                    <td className="py-3 pr-4 text-slate-600">{source.wonLeads}</td>
                    <td className="py-3 text-slate-600">{source.winRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-ink">Top tag / category</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Tags</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.length > 0 ? (
                  tags.map((tag) => (
                    <span className="rounded-full bg-cloud px-3 py-1 text-sm font-bold text-ink" key={tag.tagId}>
                      {tag.tagName} · {tag.totalLeads}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Chưa có tag đủ dữ liệu.</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Categories</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <span className="rounded-full bg-cloud px-3 py-1 text-sm font-bold text-ink" key={category.category}>
                      {category.category} · {category.totalLeads}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Chưa có category đủ dữ liệu.</p>
                )}
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
