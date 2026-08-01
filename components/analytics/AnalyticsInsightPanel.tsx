import Link from "next/link";
import { ChartContainer } from "@/components/analytics/ChartContainer";
import type { SalesMetrics, SourceBreakdownItem } from "@/lib/analytics/sales-analytics";
import type { SalesGoalWithProgress } from "@/lib/data/sales-goals";

type AnalyticsInsightPanelProps = {
  goals: SalesGoalWithProgress[];
  metrics: SalesMetrics;
  noFollowupCount: number;
  source?: SourceBreakdownItem;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function AnalyticsInsightPanel({
  goals,
  metrics,
  noFollowupCount,
  source,
}: AnalyticsInsightPanelProps) {
  return (
    <ChartContainer
      description="Các tín hiệu ngắn để quyết định việc tiếp theo, không dùng dữ liệu nhạy cảm."
      title="Gợi ý hành động"
    >
      <div className="space-y-3 text-base leading-7 text-text-secondary">
        <p>
          Bạn có <span className="font-bold text-text-primary">{formatNumber(metrics.overdue_followups)}</span>{" "}
          follow-up quá hạn.
        </p>
        <p>
          Nguồn lead nhiều nhất hiện tại:{" "}
          <span className="font-bold text-text-primary">{source?.label ?? "Chưa đủ dữ liệu"}</span>.
        </p>
        <p>
          Bạn đã có hoạt động trong{" "}
          <span className="font-bold text-text-primary">{formatNumber(metrics.active_days_7d)}/7</span>{" "}
          ngày gần nhất.
        </p>
        <p>
          Có <span className="font-bold text-text-primary">{formatNumber(noFollowupCount)}</span>{" "}
          lead chưa có lịch follow-up.
        </p>
      </div>

      <div className="mt-5 rounded-control border border-border-soft bg-surface-muted p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-text-muted">
            Mục tiêu đang ghim
          </h3>
          <Link className="text-sm font-bold text-primary hover:text-primary-hover" href="/app/analytics/goals">
            Quản lý
          </Link>
        </div>
        {goals.length > 0 ? (
          <div className="mt-3 space-y-3">
            {goals.slice(0, 3).map((goal) => (
              <Link
                className="block rounded-control border border-border-soft bg-surface p-3 transition hover:border-primary/40"
                href="/app/analytics/goals"
                key={goal.id}
              >
                <div className="flex items-center justify-between gap-3 text-sm font-bold text-text-primary">
                  <span className="min-w-0 truncate">{goal.name}</span>
                  <span>{goal.progress.progressPercent}%</span>
                </div>
                <div
                  aria-label={`Mục tiêu ${goal.name} đạt ${goal.progress.progressPercent}%`}
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={goal.progress.progressPercent}
                  className="mt-2"
                  role="progressbar"
                >
                  <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-success"
                      style={{ width: `${goal.progress.progressPercent}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-control bg-surface p-4">
            <p className="text-sm leading-6 text-text-secondary">
              Đặt mục tiêu đầu tiên để theo dõi tiến độ đều hơn.
            </p>
            <Link
              className="mt-3 inline-flex min-h-10 items-center justify-center rounded-control bg-success px-4 py-2 text-sm font-bold text-white"
              href="/app/analytics/goals/new"
            >
              Tạo mục tiêu
            </Link>
          </div>
        )}
      </div>
    </ChartContainer>
  );
}
