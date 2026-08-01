import { CheckCircle2, ClipboardCheck, MapPinned, TimerReset, TrendingUp, UsersRound } from "lucide-react";
import { AnalyticsKpiCard } from "@/components/analytics/AnalyticsKpiCard";
import type { SalesAnalyticsSummary } from "@/lib/analytics/sales-analytics";

type AnalyticsKpiGridProps = {
  summary: SalesAnalyticsSummary;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function formatPercent(value: number, denominator: number) {
  if (denominator <= 0) return "—";
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value)}%`;
}

export function AnalyticsKpiGrid({ summary }: AnalyticsKpiGridProps) {
  const metrics = summary.metrics;
  const totalMapSearches =
    metrics.near_me_searches + metrics.area_searches + metrics.route_searches;

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <AnalyticsKpiCard
        actionHref="/app/discover"
        actionLabel="Tìm khách"
        description="Lead được tạo trong khoảng thời gian đang xem."
        icon={UsersRound}
        label="Lead mới"
        value={formatNumber(metrics.leads_created)}
      />
      <AnalyticsKpiCard
        actionHref="/app/leads?status=contacted"
        actionLabel="Xem lead"
        description="Lead đã chuyển sang đã liên hệ hoặc sâu hơn trong pipeline."
        icon={CheckCircle2}
        label="Lead đã liên hệ"
        meta={`Contact rate ${formatPercent(summary.rates.contactRate, metrics.leads_created)}`}
        tone="success"
        value={formatNumber(metrics.leads_contacted)}
      />
      <AnalyticsKpiCard
        actionHref="/app/tasks?tab=completed"
        actionLabel="Xem việc"
        description="Follow-up hoặc công việc đã được đánh dấu hoàn thành."
        icon={ClipboardCheck}
        label="Task hoàn thành"
        tone="primary"
        value={formatNumber(metrics.followups_completed)}
      />
      <AnalyticsKpiCard
        actionHref="/app/tasks?tab=overdue"
        actionLabel="Xem quá hạn"
        description="Công việc đang quá hạn cần ưu tiên xử lý."
        icon={TimerReset}
        label="Follow-up quá hạn"
        tone={metrics.overdue_followups > 0 ? "warning" : "success"}
        value={formatNumber(metrics.overdue_followups)}
      />
      <AnalyticsKpiCard
        description="Tỷ lệ lead đã chốt trên tổng lead đóng trong kỳ."
        icon={TrendingUp}
        label="Tỷ lệ chuyển đổi"
        meta="Chỉ hiển thị khi có dữ liệu đóng lead."
        tone="neutral"
        value={formatPercent(
          summary.rates.winRate,
          metrics.leads_won + metrics.leads_lost + metrics.leads_not_fit,
        )}
      />
      <AnalyticsKpiCard
        actionHref="/app/discover"
        actionLabel="Mở bản đồ"
        description="Tổng lượt tìm quanh tôi, theo khu vực và dọc tuyến."
        icon={MapPinned}
        label="Lượt tìm kiếm bản đồ"
        tone="primary"
        value={formatNumber(totalMapSearches)}
      />
    </section>
  );
}
