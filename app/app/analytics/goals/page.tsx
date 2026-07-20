import { Archive, PauseCircle, Pin, PinOff, Plus, Target } from "lucide-react";
import Link from "next/link";
import {
  archiveSalesGoalAction,
  createGoalFromTemplateAction,
  pauseSalesGoalAction,
  pinSalesGoalAction,
} from "@/app/app/analytics/goals/actions";
import { Toast } from "@/components/ui/Toast";
import {
  getMetricLabel,
  GOAL_PERIODS,
  GOAL_STATUSES,
} from "@/lib/constants/sales-analytics";
import {
  getGoalTemplates,
  getSalesGoals,
  type SalesGoalWithProgress,
} from "@/lib/data/sales-goals";

export const dynamic = "force-dynamic";

type GoalsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function periodLabel(goal: SalesGoalWithProgress) {
  const label = GOAL_PERIODS[goal.period_type as keyof typeof GOAL_PERIODS] ?? goal.period_type;

  if (goal.period_start && goal.period_end) {
    return `${label}: ${goal.period_start} - ${goal.period_end}`;
  }

  return label;
}

function GoalCard({ goal }: { goal: SalesGoalWithProgress }) {
  const progress = goal.progress;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-ink">{goal.name}</h3>
            {goal.is_pinned ? (
              <span className="rounded-full bg-mint/20 px-3 py-1 text-xs font-bold text-ocean">
                Đang ghim
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {getMetricLabel(goal.metric_key)} - mục tiêu {goal.target_value}
          </p>
          <p className="mt-1 text-sm text-slate-500">{periodLabel(goal)}</p>
        </div>
        <span className="rounded-full bg-cloud px-3 py-1 text-xs font-bold text-slate-600">
          {GOAL_STATUSES[goal.status] ?? goal.status}
        </span>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3 text-sm font-bold text-ink">
          <span>
            Đã hoàn thành {progress.currentValue}/{goal.target_value}
          </span>
          <span>{progress.progressPercent}%</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-mint"
            style={{ width: `${progress.progressPercent}%` }}
          />
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {progress.remainingValue > 0
            ? `Còn ${progress.remainingValue} để đạt mục tiêu.`
            : "Bạn đã đạt mục tiêu này."}
        </p>
      </div>

      {goal.status !== "archived" ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <form action={pinSalesGoalAction}>
            <input name="goalId" type="hidden" value={goal.id} />
            <input name="pinned" type="hidden" value={goal.is_pinned ? "false" : "true"} />
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink hover:border-ocean"
              type="submit"
            >
              {goal.is_pinned ? (
                <PinOff aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Pin aria-hidden="true" className="h-4 w-4" />
              )}
              {goal.is_pinned ? "Bỏ ghim" : "Ghim"}
            </button>
          </form>
          {goal.status === "active" ? (
            <form action={pauseSalesGoalAction}>
              <input name="goalId" type="hidden" value={goal.id} />
              <button
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink hover:border-ocean"
                type="submit"
              >
                <PauseCircle aria-hidden="true" className="h-4 w-4" />
                Tạm dừng
              </button>
            </form>
          ) : null}
          <form action={archiveSalesGoalAction}>
            <input name="goalId" type="hidden" value={goal.id} />
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100"
              type="submit"
            >
              <Archive aria-hidden="true" className="h-4 w-4" />
              Lưu trữ
            </button>
          </form>
        </div>
      ) : null}
    </article>
  );
}

function GoalSection({
  emptyText,
  goals,
  title,
}: {
  emptyText: string;
  goals: SalesGoalWithProgress[];
  title: string;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      {goals.length > 0 ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {goals.map((goal) => (
            <GoalCard goal={goal} key={goal.id} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-6 text-base leading-7 text-slate-600">
          {emptyText}
        </div>
      )}
    </section>
  );
}

export default async function SalesGoalsPage(props: GoalsPageProps) {
  const searchParams = await props.searchParams;
  const { items: goals, schemaReady } = await getSalesGoals({ includeArchived: true });
  const templates = getGoalTemplates();
  const pinned = goals.filter((goal) => goal.is_pinned && goal.status !== "archived");
  const active = goals.filter((goal) => ["active", "completed", "paused"].includes(goal.status));
  const archived = goals.filter((goal) => goal.status === "archived");

  return (
    <div className="mx-auto max-w-6xl">
      <Toast code={getString(searchParams?.toast)} />
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            Mục tiêu
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Mục tiêu cá nhân
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Đặt mục tiêu lead, follow-up hoặc chốt khách để theo dõi tiến độ hằng ngày, hằng tuần, hằng tháng.
          </p>
        </div>
        <Link
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft hover:bg-[#5de0b3]"
          href="/app/analytics/goals/new"
        >
          <Plus aria-hidden="true" className="h-5 w-5" />
          Tạo mục tiêu
        </Link>
      </div>

      {!schemaReady ? (
        <section className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm font-semibold leading-6 text-amber-800">
          Chưa tìm thấy bảng sales_goals. Hãy chạy file SQL personal sales analytics trong Supabase trước khi lưu mục tiêu thật.
        </section>
      ) : null}

      <GoalSection
        emptyText="Đặt một mục tiêu nhỏ để theo dõi tiến độ làm việc mỗi ngày."
        goals={pinned}
        title="Mục tiêu đang ghim"
      />

      <GoalSection
        emptyText="Bạn chưa có mục tiêu đang hoạt động."
        goals={active}
        title="Mục tiêu đang hoạt động"
      />

      <section className="mt-8">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-mint/15 text-ocean">
            <Target aria-hidden="true" className="h-5 w-5" />
          </span>
          <h2 className="text-xl font-bold text-ink">Mẫu mục tiêu gợi ý</h2>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {templates.map((template) => (
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={template.key}>
              <h3 className="text-lg font-bold text-ink">{template.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{template.description}</p>
              <p className="mt-3 text-sm font-semibold text-slate-500">
                {getMetricLabel(template.metricKey)} - {template.targetValue} -{" "}
                {GOAL_PERIODS[template.periodType]}
              </p>
              <form action={createGoalFromTemplateAction} className="mt-4">
                <input name="templateKey" type="hidden" value={template.key} />
                <button
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink hover:border-ocean"
                  type="submit"
                >
                  Dùng mẫu này
                </button>
              </form>
            </article>
          ))}
        </div>
      </section>

      <GoalSection
        emptyText="Chưa có mục tiêu đã lưu trữ."
        goals={archived}
        title="Mục tiêu đã lưu trữ"
      />
    </div>
  );
}
