import Link from "next/link";
import { ChartContainer } from "@/components/analytics/ChartContainer";
import { ChartEmptyState } from "@/components/analytics/ChartEmptyState";
import type { SalesMetrics } from "@/lib/analytics/sales-analytics";

type MapDiscoveryAnalyticsProps = {
  metrics: SalesMetrics;
  summaryError?: boolean;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function formatRate(saved: number, searches: number) {
  if (searches <= 0) return "—";
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(
    (saved / searches) * 100,
  )}%`;
}

export function MapDiscoveryAnalytics({
  metrics,
  summaryError = false,
}: MapDiscoveryAnalyticsProps) {
  const totalSearches =
    metrics.near_me_searches + metrics.area_searches + metrics.route_searches;
  const items = [
    ["Tìm quanh tôi", metrics.near_me_searches],
    ["Tìm theo khu vực", metrics.area_searches],
    ["Tìm dọc tuyến", metrics.route_searches],
    ["Lead lưu từ bản đồ", metrics.map_leads_saved],
  ] as const;

  return (
    <ChartContainer
      description="Chỉ hiển thị số lượt tổng hợp, không dùng keyword, tọa độ hoặc dữ liệu Google Maps thô."
      error={summaryError}
      title="Map Discovery"
    >
      {totalSearches + metrics.map_leads_saved === 0 ? (
        <ChartEmptyState
          actionHref="/app/discover"
          actionLabel="Mở bản đồ"
          message="Chưa có hoạt động tìm khách bằng bản đồ trong khoảng thời gian này."
          title="Chưa có dữ liệu Map Discovery"
        />
      ) : (
        <div>
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map(([label, value]) => (
              <div className="rounded-control border border-border-soft bg-surface-muted p-4" key={label}>
                <p className="text-sm font-bold text-text-secondary">{label}</p>
                <p className="mt-3 text-2xl font-bold tabular-nums text-text-primary">
                  {formatNumber(value)}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-control border border-primary/20 bg-primary-soft px-4 py-3 text-sm font-semibold leading-6 text-primary">
            Tỷ lệ lưu lead từ tìm kiếm bản đồ: {formatRate(metrics.map_leads_saved, totalSearches)}.
          </p>
          <Link
            className="mt-5 inline-flex min-h-10 items-center justify-center rounded-control border border-border-soft bg-surface px-4 py-2 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
            href="/app/discover"
          >
            Tiếp tục tìm khách
          </Link>
        </div>
      )}
    </ChartContainer>
  );
}
