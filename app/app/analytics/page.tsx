import { RefreshCw, Target } from "lucide-react";
import { rebuildSalesAnalyticsAction } from "@/app/app/analytics/actions";
import { ActivityTrendChart } from "@/components/analytics/ActivityTrendChart";
import { AnalyticsFilterBar } from "@/components/analytics/AnalyticsFilterBar";
import { AnalyticsInsightPanel } from "@/components/analytics/AnalyticsInsightPanel";
import { AnalyticsKpiGrid } from "@/components/analytics/AnalyticsKpiGrid";
import { AnalyticsPageTracker } from "@/components/analytics/AnalyticsPageTracker";
import { AudienceBreakdown } from "@/components/analytics/AudienceBreakdown";
import { ChartErrorState } from "@/components/analytics/ChartErrorState";
import { FollowupHealth } from "@/components/analytics/FollowupHealth";
import { LeadFunnel } from "@/components/analytics/LeadFunnel";
import { LeadSourceChart } from "@/components/analytics/LeadSourceChart";
import { MapDiscoveryAnalytics } from "@/components/analytics/MapDiscoveryAnalytics";
import { PipelineDistribution } from "@/components/analytics/PipelineDistribution";
import { TaskPerformance } from "@/components/analytics/TaskPerformance";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toast } from "@/components/ui/Toast";
import {
  calculateCategoryBreakdownForUser,
  calculateDailyTrendForUser,
  calculatePipelineFunnelForUser,
  calculateSalesMetricsForUser,
  calculateSourceBreakdownForUser,
  calculateTagBreakdownForUser,
  getDateRangeForPeriod,
  type CategoryBreakdownItem,
  type DailyTrendItem,
  type PipelineFunnel,
  type SalesAnalyticsSummary,
  type SalesMetrics,
  type SourceBreakdownItem,
  type TagBreakdownItem,
} from "@/lib/analytics/sales-analytics";
import type { AnalyticsPeriodKey } from "@/lib/constants/sales-analytics";
import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import { getFilteredLeadCount } from "@/lib/data/lead-filtered-list";
import { getPinnedSalesGoals, type SalesGoalWithProgress } from "@/lib/data/sales-goals";
import { analyticsPeriodSchema, type AnalyticsPeriodInput } from "@/lib/validators/sales-analytics";

export const dynamic = "force-dynamic";

type AnalyticsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

type GoalsResult = {
  items: SalesGoalWithProgress[];
  schemaReady: boolean;
};

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePeriod(searchParams?: AnalyticsPageProps["searchParams"]): AnalyticsPeriodInput {
  const parsed = analyticsPeriodSchema.safeParse({
    customFrom: getString(searchParams?.customFrom),
    customTo: getString(searchParams?.customTo),
    period: getString(searchParams?.period) || "last_7_days",
  });

  return parsed.success ? parsed.data : { period: "last_7_days" as AnalyticsPeriodKey };
}

function createEmptyMetrics(): SalesMetrics {
  return {
    active_days_30d: 0,
    active_days_7d: 0,
    ai_requests: 0,
    area_searches: 0,
    exports_completed: 0,
    followups_completed: 0,
    followups_created: 0,
    import_rows_completed: 0,
    lead_notes_created: 0,
    leads_contacted: 0,
    leads_created: 0,
    leads_lost: 0,
    leads_not_fit: 0,
    leads_won: 0,
    map_leads_saved: 0,
    near_me_searches: 0,
    overdue_followups: 0,
    pipeline_status_changes: 0,
    route_searches: 0,
    templates_copied: 0,
  };
}

function createEmptySummary(): SalesAnalyticsSummary {
  return {
    metrics: createEmptyMetrics(),
    rates: {
      activityConsistency30d: 0,
      activityConsistency7d: 0,
      contactRate: 0,
      followUpRate: 0,
      interestRate: 0,
      winRate: 0,
    },
  };
}

function createEmptyFunnel(): PipelineFunnel {
  return {
    conversionRates: {
      contactedToInterested: 0,
      followUpToWon: 0,
      interestedToFollowUp: 0,
      newToContacted: 0,
      overallWinRate: 0,
    },
    stages: [
      { count: 0, key: "new", label: "Mới" },
      { count: 0, key: "contacted", label: "Đã liên hệ" },
      { count: 0, key: "interested", label: "Quan tâm" },
      { count: 0, key: "follow_up", label: "Follow-up" },
      { count: 0, key: "won", label: "Đã chốt" },
    ],
  };
}

function settledValue<T>(result: PromiseSettledResult<T>, fallback: T) {
  return result.status === "fulfilled" ? result.value : fallback;
}

function hasCoreData(summary: SalesAnalyticsSummary) {
  const metrics = summary.metrics;

  return (
    metrics.leads_created +
      metrics.leads_contacted +
      metrics.lead_notes_created +
      metrics.followups_created +
      metrics.followups_completed +
      metrics.pipeline_status_changes +
      metrics.near_me_searches +
      metrics.area_searches +
      metrics.route_searches +
      metrics.map_leads_saved >
    0
  );
}

export default async function SalesAnalyticsPage(props: AnalyticsPageProps) {
  const searchParams = await props.searchParams;
  const period = parsePeriod(searchParams);
  const range = getDateRangeForPeriod(period);
  const { userId } = await createAuthedSupabaseServerClient();
  const [
    summaryResult,
    funnelResult,
    sourcesResult,
    tagsResult,
    categoriesResult,
    trendsResult,
    pinnedGoalsResult,
    noFollowupCountResult,
  ] = await Promise.allSettled([
    calculateSalesMetricsForUser(userId, period),
    calculatePipelineFunnelForUser(userId, period),
    calculateSourceBreakdownForUser(userId, period),
    calculateTagBreakdownForUser(userId, period),
    calculateCategoryBreakdownForUser(userId, period),
    calculateDailyTrendForUser(userId, period.period === "today" ? "last_7_days" : period),
    getPinnedSalesGoals(),
    getFilteredLeadCount({ noFollowUp: true }),
  ]);
  const summary = settledValue(summaryResult, createEmptySummary());
  const funnel = settledValue(funnelResult, createEmptyFunnel());
  const sources = settledValue<SourceBreakdownItem[]>(sourcesResult, []);
  const tags = settledValue<TagBreakdownItem[]>(tagsResult, []);
  const categories = settledValue<CategoryBreakdownItem[]>(categoriesResult, []);
  const trends = settledValue<DailyTrendItem[]>(trendsResult, []);
  const pinnedGoals = settledValue<GoalsResult>(pinnedGoalsResult, {
    items: [],
    schemaReady: false,
  });
  const noFollowupCount = settledValue(noFollowupCountResult, 0);
  const summaryError = summaryResult.status === "rejected";
  const funnelError = funnelResult.status === "rejected";
  const sourcesError = sourcesResult.status === "rejected";
  const trendsError = trendsResult.status === "rejected";
  const audienceError = tagsResult.status === "rejected" || categoriesResult.status === "rejected";
  const hasAnyData =
    hasCoreData(summary) ||
    funnel.stages.some((stage) => stage.count > 0) ||
    sources.length > 0 ||
    trends.some((item) => item.leadsCreated + item.followupsCompleted + item.leadsWon > 0);

  return (
    <div className="mx-auto max-w-7xl">
      <Toast code={getString(searchParams?.toast)} />
      <AnalyticsPageTracker
        activeGoalsCount={pinnedGoals.items.length}
        hasGoals={pinnedGoals.items.length > 0}
        period={period.period}
      />

      <PageHeader
        actions={
          <>
            <a
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-6 py-3 text-base font-semibold text-text-primary shadow-sm transition hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
              href="/app/analytics/goals"
            >
              <Target aria-hidden="true" className="h-5 w-5" />
              Mục tiêu
            </a>
            <form action={rebuildSalesAnalyticsAction}>
              <button
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-6 py-3 text-base font-semibold text-text-primary shadow-sm transition hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
                type="submit"
              >
                <RefreshCw aria-hidden="true" className="h-5 w-5" />
                Cập nhật số liệu
              </button>
            </form>
          </>
        }
        description="Theo dõi hiệu quả tìm khách, chăm sóc lead và hoàn thành công việc."
        eyebrow="Analytics"
        fullBleed
        title="Phân tích hoạt động"
      >
        <p className="mt-3 text-sm font-semibold text-text-muted">
          Đang xem: {range.label}. Dữ liệu được tổng hợp theo tài khoản hiện tại.
        </p>
      </PageHeader>

      <div className="mt-6">
        <AnalyticsFilterBar period={period} />
      </div>

      {!hasAnyData && !summaryError ? (
        <section className="mt-6 rounded-card border border-dashed border-border-strong bg-surface p-6 shadow-card">
          <h2 className="text-xl font-bold text-text-primary">Chưa đủ dữ liệu để phân tích</h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-text-secondary">
            Hãy tìm khách, lưu lead và hoàn thành các công việc chăm sóc. SaleMap sẽ tổng hợp hoạt động của bạn tại đây.
          </p>
          <a
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-control bg-primary px-6 py-3 text-base font-bold text-white shadow-soft transition hover:bg-primary-hover"
            href="/app/discover"
          >
            Tìm khách đầu tiên
          </a>
        </section>
      ) : null}

      <div className="mt-6">
        {summaryError ? (
          <ChartErrorState message="Không thể tải KPI. Các phần còn lại vẫn được hiển thị nếu có dữ liệu." />
        ) : (
          <AnalyticsKpiGrid summary={summary} />
        )}
      </div>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <TaskPerformance metrics={summary.metrics} summaryError={summaryError} />
        <FollowupHealth
          metrics={summary.metrics}
          noFollowupCount={noFollowupCount}
          summaryError={summaryError}
        />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <LeadFunnel error={funnelError} funnel={funnel} />
        <ActivityTrendChart error={trendsError} trends={trends} />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <LeadSourceChart error={sourcesError} sources={sources} />
        <PipelineDistribution error={funnelError} funnel={funnel} />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <MapDiscoveryAnalytics metrics={summary.metrics} summaryError={summaryError} />
        <AnalyticsInsightPanel
          goals={pinnedGoals.items}
          metrics={summary.metrics}
          noFollowupCount={noFollowupCount}
          source={sources[0]}
        />
      </section>

      <div className="mt-8">
        <AudienceBreakdown categories={categories} error={audienceError} tags={tags} />
      </div>
    </div>
  );
}
