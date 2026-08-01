import Link from "next/link";
import { CalendarClock, ClipboardList, TimerReset, UserRoundX } from "lucide-react";
import { ChartContainer } from "@/components/analytics/ChartContainer";
import type { SalesMetrics } from "@/lib/analytics/sales-analytics";

type FollowupHealthProps = {
  metrics: SalesMetrics;
  noFollowupCount: number;
  summaryError?: boolean;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function FollowupHealth({
  metrics,
  noFollowupCount,
  summaryError = false,
}: FollowupHealthProps) {
  const items = [
    {
      href: "/app/tasks?tab=today",
      icon: CalendarClock,
      label: "Follow-up đã tạo",
      value: metrics.followups_created,
    },
    {
      href: "/app/tasks?tab=overdue",
      icon: TimerReset,
      label: "Follow-up quá hạn",
      value: metrics.overdue_followups,
    },
    {
      href: "/app/tasks?tab=no_schedule",
      icon: UserRoundX,
      label: "Lead chưa có lịch",
      value: noFollowupCount,
    },
    {
      href: "/app/tasks?tab=completed",
      icon: ClipboardList,
      label: "Follow-up hoàn thành",
      value: metrics.followups_completed,
    },
  ];

  return (
    <ChartContainer
      description="Các chỉ số tạo hành động để không bỏ quên lead đang cần chăm sóc."
      error={summaryError}
      title="Sức khỏe follow-up"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              className="rounded-control border border-border-soft bg-surface-muted p-4 transition hover:border-primary/40 hover:bg-primary-soft"
              href={item.href}
              key={item.label}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-text-secondary">{item.label}</p>
                <span className="flex h-9 w-9 items-center justify-center rounded-control bg-surface text-primary">
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold tabular-nums text-text-primary">
                {formatNumber(item.value)}
              </p>
            </Link>
          );
        })}
      </div>
    </ChartContainer>
  );
}
