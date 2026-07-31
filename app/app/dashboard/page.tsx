import { BetaChecklistCard } from "@/components/beta/BetaChecklistCard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStatGrid } from "@/components/dashboard/DashboardStatGrid";
import { LeadsRequiringAttention } from "@/components/dashboard/LeadsRequiringAttention";
import { QuickDiscoveryCard } from "@/components/dashboard/QuickDiscoveryCard";
import { QuotaSummary } from "@/components/dashboard/QuotaSummary";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { TodayTasks } from "@/components/dashboard/TodayTasks";
import { ActivationChecklist } from "@/components/onboarding/ActivationChecklist";
import { BetaSurveyModal } from "@/components/surveys/BetaSurveyModal";
import { Toast } from "@/components/ui/Toast";
import { DashboardTracker } from "@/components/app/DashboardTracker";
import { FirstRunGuideCard } from "@/components/app/FirstRunGuideCard";
import { BETA_CHECKLIST_ITEMS, type BetaChecklistKey } from "@/lib/constants/beta-checklist";
import { DASHBOARD_QUOTA_ACTIONS } from "@/lib/constants/quota";
import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import { getBetaChecklistProgress } from "@/lib/data/beta-checklist";
import {
  getDashboardData,
  type DashboardRecentLead,
} from "@/lib/data/dashboard";
import {
  getActivationProgressWithChecklist,
  hasDemoData,
  safeMarkActivationStep,
} from "@/lib/data/onboarding";
import { getCurrentSubscription } from "@/lib/data/subscriptions";
import { getBetaRound2SurveyState } from "@/lib/data/surveys";
import { getTaskCounts, getTodayTasks, type TaskCounts } from "@/lib/data/tasks";
import { getDailyUsageSnapshot } from "@/lib/data/usage";
import { isFeatureEnabled } from "@/lib/data/feature-flags";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const fallbackTaskCounts: TaskCounts = {
  completedToday: 0,
  leadsWithoutTasks: 0,
  overdue: 0,
  today: 0,
  upcoming: 0,
};

const fallbackDashboardData: Awaited<ReturnType<typeof getDashboardData>> = {
  fullName: undefined,
  newLeadsThisWeek: 0,
  overdueReminders: 0,
  recentLeads: [] as DashboardRecentLead[],
  todayReminderItems: [],
  todayReminders: 0,
  totalLeads: 0,
  totalNotes: 0,
  totalRemindersCreated: 0,
};

const fallbackTodayTasks: Awaited<ReturnType<typeof getTodayTasks>> = {
  items: [],
  limit: 7,
  page: 1,
  total: 0,
};

const fallbackBetaChecklist = {
  completed: new Set<BetaChecklistKey>(),
  done: 0,
  items: BETA_CHECKLIST_ITEMS,
  progress: [],
  schemaReady: false,
  total: BETA_CHECKLIST_ITEMS.length,
};

type DashboardActivation = Omit<
  Awaited<ReturnType<typeof getActivationProgressWithChecklist>>,
  "progress"
>;

const fallbackActivation: DashboardActivation = {
  checklist: [],
  completedCount: 0,
  score: 0,
  totalCount: 0,
};

const fallbackSurveyState: Awaited<ReturnType<typeof getBetaRound2SurveyState>> = {
  eligible: false,
  hasSubmitted: false,
  leadCount: 0,
};

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

async function withWidgetFallback<T>(promise: Promise<T>, fallback: T) {
  const [result] = await Promise.allSettled([promise]);

  return result.status === "fulfilled" ? result.value : fallback;
}

export default async function DashboardPage(props: DashboardPageProps) {
  const searchParams = await props.searchParams;
  await createAuthedSupabaseServerClient();
  void safeMarkActivationStep("viewed_dashboard");

  const [
    data,
    taskCounts,
    todayTasks,
    betaChecklist,
    quota,
    surveyState,
    betaSurveyEnabled,
    planName,
    activation,
    demoDataExists,
  ] = await Promise.all([
    withWidgetFallback(getDashboardData(), fallbackDashboardData),
    withWidgetFallback(getTaskCounts(), fallbackTaskCounts),
    withWidgetFallback(getTodayTasks(), fallbackTodayTasks),
    withWidgetFallback(getBetaChecklistProgress(), fallbackBetaChecklist),
    withWidgetFallback(
      getDailyUsageSnapshot(DASHBOARD_QUOTA_ACTIONS),
      {
        items: [],
        schemaReady: false,
      },
    ),
    withWidgetFallback(getBetaRound2SurveyState(), fallbackSurveyState),
    withWidgetFallback(isFeatureEnabled("beta_survey"), false),
    withWidgetFallback(getCurrentSubscription().then((result) => result.plan.name), "Free"),
    withWidgetFallback(
      getActivationProgressWithChecklist().then(
        ({ checklist, completedCount, score, totalCount }) => ({
          checklist,
          completedCount,
          score,
          totalCount,
        }),
      ),
      fallbackActivation,
    ),
    withWidgetFallback(hasDemoData(), false),
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

      <div className="mx-auto max-w-7xl">
        <DashboardHeader fullName={data.fullName} taskCounts={taskCounts} />

        <div className="mt-5 hidden lg:block">
          <DashboardStatGrid
            newLeadsThisWeek={data.newLeadsThisWeek}
            taskCounts={taskCounts}
            totalLeads={data.totalLeads}
          />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] lg:items-start">
          <main className="grid gap-5">
            <TodayTasks counts={taskCounts} tasks={todayTasks.items} />
            <div className="lg:hidden">
              <DashboardStatGrid
                newLeadsThisWeek={data.newLeadsThisWeek}
                taskCounts={taskCounts}
                totalLeads={data.totalLeads}
              />
            </div>
            <LeadsRequiringAttention
              recentLeads={data.recentLeads}
              tasks={todayTasks.items}
            />
            <div className="lg:hidden">
              <QuickDiscoveryCard />
            </div>
            <div className="lg:hidden">
              <ActivationChecklist
                completedCount={activation.completedCount}
                hasDemoData={demoDataExists}
                items={activation.checklist}
                score={activation.score}
                totalCount={activation.totalCount}
              />
            </div>
            <div className="lg:hidden">
              <QuotaSummary
                items={quota.items}
                planName={planName}
                schemaReady={quota.schemaReady}
              />
            </div>
            <RecentActivity
              recentLeads={data.recentLeads}
              tasks={todayTasks.items}
            />
          </main>

          <aside className="grid gap-5 lg:sticky lg:top-[92px]">
            <div className="hidden lg:block">
              <QuickDiscoveryCard />
            </div>
            <div className="hidden lg:block">
              <ActivationChecklist
                completedCount={activation.completedCount}
                hasDemoData={demoDataExists}
                items={activation.checklist}
                score={activation.score}
                totalCount={activation.totalCount}
              />
            </div>
            <div className="hidden lg:block">
              <QuotaSummary
                items={quota.items}
                planName={planName}
                schemaReady={quota.schemaReady}
              />
            </div>
            <BetaChecklistCard
              completed={betaChecklist.completed}
              done={betaChecklist.done}
              items={betaChecklist.items}
              schemaReady={betaChecklist.schemaReady}
              total={betaChecklist.total}
            />
            {coreActionsCompleted < 3 ? (
              <FirstRunGuideCard
                completed={{
                  hasLead: data.totalLeads > 0,
                  hasNote: data.totalNotes > 0,
                  hasReminder: data.totalRemindersCreated > 0,
                }}
              />
            ) : null}
          </aside>
        </div>

        {betaSurveyEnabled ? (
          <BetaSurveyModal
            coreActionsCompleted={coreActionsCompleted}
            eligible={surveyState.eligible}
            hasCoreLoop={coreActionsCompleted === 3}
            hasSubmitted={surveyState.hasSubmitted}
          />
        ) : null}
      </div>
    </>
  );
}
