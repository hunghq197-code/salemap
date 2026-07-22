import {
  BarChart3,
  Bell,
  BookOpenText,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  ListChecks,
  MapPinned,
  MessageSquareHeart,
  PauseCircle,
  Plus,
  Route,
  Search,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { DashboardTracker } from "@/components/app/DashboardTracker";
import { TodayTasksWidget } from "@/components/dashboard/TodayTasksWidget";
import { FirstRunGuideCard } from "@/components/app/FirstRunGuideCard";
import { BetaChecklistCard } from "@/components/beta/BetaChecklistCard";
import { LeadStatusBadge } from "@/components/leads/LeadStatusBadge";
import { QuotaUsageCard } from "@/components/quota/QuotaUsageCard";
import { BetaSurveyModal } from "@/components/surveys/BetaSurveyModal";
import { Toast } from "@/components/ui/Toast";
import { getCadenceStatusLabel } from "@/lib/constants/cadences";
import { DASHBOARD_QUOTA_ACTIONS } from "@/lib/constants/quota";
import { calculateSalesMetricsForUser } from "@/lib/analytics/sales-analytics";
import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import { getBetaChecklistProgress } from "@/lib/data/beta-checklist";
import { getCadenceDashboardSummary } from "@/lib/data/cadences";
import { getDashboardData } from "@/lib/data/dashboard";
import { isFeatureEnabled } from "@/lib/data/feature-flags";
import { getSavedViewsWithCounts } from "@/lib/data/lead-saved-views";
import { getPinnedSalesGoals } from "@/lib/data/sales-goals";
import { getCurrentSubscription } from "@/lib/data/subscriptions";
import { getBetaRound2SurveyState } from "@/lib/data/surveys";
import { getTaskCounts, getTodayTasks } from "@/lib/data/tasks";
import { getDailyUsageSnapshot } from "@/lib/data/usage";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  icon: typeof UsersRound;
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-bold text-slate-500">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-mint/15 text-ocean">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold text-ink">{value}</p>
    </article>
  );
}

export default async function DashboardPage(props: DashboardPageProps) {
  const searchParams = await props.searchParams;
  const { userId } = await createAuthedSupabaseServerClient();
  const [
    data,
    taskCounts,
    cadenceSummary,
    todayTasks,
    betaChecklist,
    quota,
    surveyState,
    betaSurveyEnabled,
    subscriptionResult,
    leadViews,
    todaySales,
    pinnedGoals,
  ] = await Promise.all([
    getDashboardData(),
    getTaskCounts(),
    getCadenceDashboardSummary(),
    getTodayTasks(),
    getBetaChecklistProgress(),
    getDailyUsageSnapshot(DASHBOARD_QUOTA_ACTIONS),
    getBetaRound2SurveyState(),
    isFeatureEnabled("beta_survey"),
    getCurrentSubscription(),
    getSavedViewsWithCounts(),
    calculateSalesMetricsForUser(userId, "today"),
    getPinnedSalesGoals(),
  ]);
  const coreActionsCompleted = [
    data.totalLeads > 0,
    data.totalNotes > 0,
    data.totalRemindersCreated > 0,
  ].filter(Boolean).length;

  return (
    <>
      <DashboardTracker />
      <Toast code={getString(searchParams?.toast)} />
      <div className="mx-auto max-w-6xl">
        <section className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
              Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">
              Xin chào, {data.fullName || "bạn"}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Theo dõi lead cá nhân, việc cần gọi lại và các cơ hội mới trong một màn hình gọn.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft transition hover:bg-[#5de0b3]"
              href="/app/discover"
            >
              <Search aria-hidden="true" className="h-5 w-5" />
              Tìm khách mới
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm transition hover:border-ocean"
              href="/app/leads?create=1"
            >
              <Plus aria-hidden="true" className="h-5 w-5" />
              Thêm lead
            </Link>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-ocean/20 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-mint/15 text-ocean">
                <Sparkles aria-hidden="true" className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-ink">Chào mừng bạn đến với SaleMap</h2>
                <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">
                  Góp ý của bạn sẽ giúp sản phẩm sát hơn với công việc sale thực tế.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-base font-bold text-white transition hover:bg-ocean"
                href="/app/huong-dan"
              >
                <BookOpenText aria-hidden="true" className="h-5 w-5" />
                Xem hướng dẫn
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm transition hover:border-ocean"
                href="/app/feedback"
              >
                <MessageSquareHeart aria-hidden="true" className="h-5 w-5" />
                Gửi góp ý
              </Link>
            </div>
          </div>
        </section>

        <BetaChecklistCard
          completed={betaChecklist.completed}
          done={betaChecklist.done}
          items={betaChecklist.items}
          schemaReady={betaChecklist.schemaReady}
          total={betaChecklist.total}
        />

        {betaSurveyEnabled ? (
          <BetaSurveyModal
            coreActionsCompleted={coreActionsCompleted}
            eligible={surveyState.eligible}
            hasCoreLoop={coreActionsCompleted === 3}
            hasSubmitted={surveyState.hasSubmitted}
          />
        ) : null}

        {coreActionsCompleted < 3 ? (
          <FirstRunGuideCard
            completed={{
              hasLead: data.totalLeads > 0,
              hasNote: data.totalNotes > 0,
              hasReminder: data.totalRemindersCreated > 0,
            }}
          />
        ) : null}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={UsersRound} label="Tổng lead" value={data.totalLeads} />
          <StatCard icon={Bell} label="Follow-up hôm nay" value={taskCounts.today} />
          <StatCard icon={Clock3} label="Quá hạn" value={taskCounts.overdue} />
          <StatCard icon={CalendarPlus} label="Lead mới tuần này" value={data.newLeadsThisWeek} />
        </section>

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-mint/15 text-ocean">
                <ListChecks aria-hidden="true" className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-ink">Quy trình chăm sóc</h2>
                <p className="mt-2 text-base leading-7 text-slate-600">
                  Theo dõi các nhịp chăm sóc lead đang chạy và việc đã hoàn thành.
                </p>
              </div>
            </div>
            <Link className="text-sm font-bold text-ocean hover:text-ink" href="/app/cadences">
              Mở quy trình
            </Link>
          </div>
          {!cadenceSummary.schemaReady ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
              Chưa thấy bảng cadence. Chạy `supabase/cadences.sql` và seed template để bật widget này.
            </div>
          ) : null}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <StatCard icon={ListChecks} label="Đang chạy" value={cadenceSummary.activeCount} />
            <StatCard icon={PauseCircle} label="Tạm dừng" value={cadenceSummary.pausedCount} />
            <StatCard icon={CheckCircle2} label="Hoàn thành tháng này" value={cadenceSummary.completedThisMonth} />
          </div>
          {cadenceSummary.recent.length > 0 ? (
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {cadenceSummary.recent.map((item) => (
                <Link
                  className="rounded-lg border border-slate-200 bg-cloud/60 p-4 hover:border-ocean hover:bg-white"
                  href="/app/cadences"
                  key={item.id}
                >
                  <p className="truncate text-sm font-bold text-ink">{item.templateName}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {item.completedSteps}/{item.totalSteps} bước ·{" "}
                    {getCadenceStatusLabel(item.status)}
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-mint"
                      style={{
                        width: `${
                          item.totalSteps
                            ? Math.round((item.completedSteps / item.totalSteps) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </section>

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-ink">Hiệu suất hôm nay</h2>
              <p className="mt-2 text-base leading-7 text-slate-600">
                Nhịp làm việc cá nhân trong ngày: lead mới, follow-up và cơ hội đã chốt.
              </p>
            </div>
            <Link className="text-sm font-bold text-ocean hover:text-ink" href="/app/analytics">
              Xem hiệu suất
            </Link>
          </div>
          {todaySales.metrics.leads_created === 0 &&
          todaySales.metrics.followups_created === 0 &&
          todaySales.metrics.followups_completed === 0 ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
              Hôm nay bạn chưa tạo lead hoặc follow-up nào. Bắt đầu bằng việc thêm lead hoặc mở danh sách cần follow-up.
            </div>
          ) : null}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={UsersRound} label="Lead mới hôm nay" value={todaySales.metrics.leads_created} />
            <StatCard icon={Bell} label="Follow-up cần làm" value={taskCounts.today} />
            <StatCard icon={CheckCircle2} label="Follow-up hoàn thành" value={todaySales.metrics.followups_completed} />
            <StatCard icon={BarChart3} label="Lead đã chốt" value={todaySales.metrics.leads_won} />
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-ink">Mục tiêu đang theo dõi</h2>
              <p className="mt-2 text-base leading-7 text-slate-600">
                Các mục tiêu đã ghim để bạn biết hôm nay cần đẩy thêm điểm nào.
              </p>
            </div>
            <Link className="text-sm font-bold text-ocean hover:text-ink" href="/app/analytics/goals">
              Xem mục tiêu
            </Link>
          </div>
          {pinnedGoals.items.length > 0 ? (
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {pinnedGoals.items.slice(0, 3).map((goal) => (
                <Link
                  className="rounded-lg border border-slate-200 bg-cloud/60 p-4 hover:border-ocean hover:bg-white"
                  href="/app/analytics/goals"
                  key={goal.id}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-mint/15 text-ocean">
                      <Target aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{goal.name}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {goal.progress.currentValue}/{goal.target_value} · {goal.progress.progressPercent}%
                      </p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-mint"
                          style={{ width: `${goal.progress.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-cloud/70 p-5">
              <p className="text-base leading-7 text-slate-600">
                Đặt mục tiêu đầu tiên để theo dõi tiến độ làm việc mỗi ngày.
              </p>
              <Link
                className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg bg-mint px-4 py-2 text-sm font-bold text-ink"
                href="/app/analytics/goals/new"
              >
                Tạo mục tiêu
              </Link>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-ink">Góc nhìn nhanh</h2>
              <p className="mt-2 text-base leading-7 text-slate-600">
                Mở nhanh các nhóm lead cần chăm sóc hôm nay.
              </p>
            </div>
            <Link className="text-sm font-bold text-ocean hover:text-ink" href="/app/leads/views">
              Quản lý góc nhìn
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {(leadViews.filter((view) => view.is_pinned).length > 0
              ? leadViews.filter((view) => view.is_pinned)
              : leadViews.slice(0, 4)
            )
              .slice(0, 4)
              .map((view) => (
                <Link
                  className="rounded-lg border border-slate-200 bg-cloud/60 p-4 transition hover:border-ocean hover:bg-white"
                  href={`/app/leads/views/${view.id}`}
                  key={view.id}
                >
                  <p className="text-sm font-bold text-slate-500">{view.name}</p>
                  <p className="mt-3 text-3xl font-bold text-ink">{view.count}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {view.filterSummary.slice(0, 2).join(" - ")}
                  </p>
                </Link>
              ))}
          </div>
        </section>

        <div className="mt-8">
          <QuotaUsageCard
            items={quota.items}
            planName={subscriptionResult.plan.name}
            schemaReady={quota.schemaReady}
            sourcePage="dashboard"
          />
        </div>

        <section className="mt-8 rounded-lg border border-ocean/20 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-ocean/10 text-ocean">
                <MapPinned aria-hidden="true" className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-ink">
                  Bắt đầu tìm khách bằng bản đồ
                </h2>
                <p className="mt-2 text-base leading-7 text-slate-600">
                  Tìm khách quanh bạn hoặc theo khu vực, sau đó lưu vào lead cá nhân.
                </p>
              </div>
            </div>
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-base font-bold text-white transition hover:bg-ocean"
              href="/app/discover"
            >
              <Search aria-hidden="true" className="h-5 w-5" />
              Tìm khách mới
            </Link>
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-mint/30 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-mint/15 text-ocean">
                <Route aria-hidden="true" className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-ink">
                  Tìm khách dọc tuyến
                </h2>
                <p className="mt-2 text-base leading-7 text-slate-600">
                  Nhập tuyến đường hôm nay và tìm các khách tiềm năng có thể ghé thêm.
                </p>
              </div>
            </div>
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft transition hover:bg-[#5de0b3]"
              href="/app/discover?tab=route"
            >
              <Route aria-hidden="true" className="h-5 w-5" />
              Tìm dọc tuyến
            </Link>
          </div>
        </section>

        <TodayTasksWidget counts={taskCounts} tasks={todayTasks.items} />

        <section className="mt-8">
          <article>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-ink">Lead mới lưu gần đây</h2>
              <Link className="text-sm font-bold text-ocean hover:text-ink" href="/app/leads">
                Mở danh sách
              </Link>
            </div>
            {data.recentLeads.length > 0 ? (
              <div className="space-y-3">
                {data.recentLeads.map((lead) => (
                  <Link
                    className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-ocean"
                    href={`/app/leads/${lead.id}`}
                    key={lead.id}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-bold text-ink">{lead.name}</p>
                      <LeadStatusBadge status={lead.status} />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {lead.category || lead.address || "Chưa có phân loại/khu vực"}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-white p-5 text-base leading-8 text-slate-600 shadow-sm">
                <p className="font-bold text-ink">Bạn chưa có lead nào.</p>
                <p className="mt-2">
                  Hãy thêm lead đầu tiên để bắt đầu theo dõi khách tiềm năng.
                </p>
                <Link
                  className="mt-4 inline-flex min-h-12 items-center justify-center rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink"
                  href="/app/leads?create=1"
                >
                  Thêm lead đầu tiên
                </Link>
              </div>
            )}
          </article>
        </section>
      </div>
    </>
  );
}
