import Link from "next/link";
import { ClipboardCheck, TimerReset, ListChecks, Activity } from "lucide-react";
import { ChartContainer } from "@/components/analytics/ChartContainer";
import type { SalesMetrics } from "@/lib/analytics/sales-analytics";

type TaskPerformanceProps = {
  metrics: SalesMetrics;
  summaryError?: boolean;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function completionRate(completed: number, created: number) {
  if (created <= 0) return "—";
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(
    (completed / created) * 100,
  )}%`;
}

export function TaskPerformance({ metrics, summaryError = false }: TaskPerformanceProps) {
  const items = [
    {
      icon: ListChecks,
      label: "Task đã tạo",
      value: formatNumber(metrics.followups_created),
    },
    {
      icon: ClipboardCheck,
      label: "Task hoàn thành",
      value: formatNumber(metrics.followups_completed),
    },
    {
      icon: TimerReset,
      label: "Công việc quá hạn",
      value: formatNumber(metrics.overdue_followups),
    },
    {
      icon: Activity,
      label: "Tỷ lệ hoàn thành",
      value: completionRate(metrics.followups_completed, metrics.followups_created),
    },
  ];

  return (
    <ChartContainer
      description="Tập trung vào nhịp chăm sóc lead, không tạo productivity score mới."
      error={summaryError}
      title="Hiệu suất công việc"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div className="rounded-control border border-border-soft bg-surface-muted p-4" key={item.label}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-text-secondary">{item.label}</p>
                <span className="flex h-9 w-9 items-center justify-center rounded-control bg-primary-soft text-primary">
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold tabular-nums text-text-primary">
                {item.value}
              </p>
            </div>
          );
        })}
      </div>
      <Link
        className="mt-5 inline-flex min-h-10 items-center justify-center rounded-control border border-border-soft bg-surface px-4 py-2 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
        href="/app/tasks"
      >
        Mở trung tâm công việc
      </Link>
    </ChartContainer>
  );
}
