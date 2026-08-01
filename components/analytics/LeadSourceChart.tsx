import Link from "next/link";
import { ChartContainer } from "@/components/analytics/ChartContainer";
import { ChartEmptyState } from "@/components/analytics/ChartEmptyState";
import type { SourceBreakdownItem } from "@/lib/analytics/sales-analytics";

type LeadSourceChartProps = {
  error?: boolean;
  sources: SourceBreakdownItem[];
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value)}%`;
}

export function LeadSourceChart({ error = false, sources }: LeadSourceChartProps) {
  const total = sources.reduce((sum, source) => sum + source.totalLeads, 0);

  return (
    <ChartContainer
      description="Nguồn lead được tổng hợp theo source thật đang lưu trên lead."
      error={error}
      title="Lead theo nguồn"
    >
      {total === 0 ? (
        <ChartEmptyState
          actionHref="/app/import"
          actionLabel="Nhập danh sách"
          message="Chưa có source đủ dữ liệu trong khoảng thời gian này."
          title="Chưa có dữ liệu nguồn lead"
        />
      ) : (
        <div className="space-y-4">
          {sources.slice(0, 6).map((source) => {
            const share = total > 0 ? (source.totalLeads / total) * 100 : 0;

            return (
              <div key={source.source}>
                <div className="flex items-center justify-between gap-3 text-sm font-bold text-text-primary">
                  <span className="min-w-0 truncate">{source.label}</span>
                  <span>{formatNumber(source.totalLeads)}</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-surface-muted">
                  <div className="h-full rounded-full bg-success" style={{ width: `${Math.max(4, share)}%` }} />
                </div>
                <p className="mt-1 text-xs font-semibold text-text-muted">
                  {formatPercent(share)} tổng lead · won {formatNumber(source.wonLeads)} · win rate {formatPercent(source.winRate)}
                </p>
              </div>
            );
          })}
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-control border border-border-soft bg-surface px-4 py-2 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
            href="/app/analytics/sources"
          >
            Xem chi tiết nguồn
          </Link>
        </div>
      )}
    </ChartContainer>
  );
}
