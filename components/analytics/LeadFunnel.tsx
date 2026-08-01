import Link from "next/link";
import { ChartContainer } from "@/components/analytics/ChartContainer";
import { ChartEmptyState } from "@/components/analytics/ChartEmptyState";
import type { PipelineFunnel } from "@/lib/analytics/sales-analytics";

type LeadFunnelProps = {
  error?: boolean;
  funnel: PipelineFunnel;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function formatRate(count: number, previousCount: number) {
  if (previousCount <= 0) return "—";
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(
    (count / previousCount) * 100,
  )}%`;
}

export function LeadFunnel({ error = false, funnel }: LeadFunnelProps) {
  const maxCount = Math.max(1, ...funnel.stages.map((stage) => stage.count));
  const hasData = funnel.stages.some((stage) => stage.count > 0);

  return (
    <ChartContainer
      description="Funnel dùng status hiện có trong SaleMap, không tự thêm stage mới."
      error={error}
      title="Lead funnel"
    >
      {!hasData ? (
        <ChartEmptyState
          actionHref="/app/pipeline"
          actionLabel="Mở pipeline"
          message="Chưa có lead trong các stage để dựng funnel."
          title="Chưa có dữ liệu funnel"
        />
      ) : (
        <div className="space-y-4">
          {funnel.stages.map((stage, index) => {
            const previous = index === 0 ? stage.count : funnel.stages[index - 1].count;
            const width = Math.max(6, (stage.count / maxCount) * 100);

            return (
              <div key={stage.key}>
                <div className="flex items-center justify-between gap-3 text-sm font-bold text-text-primary">
                  <span>{stage.label}</span>
                  <span>{formatNumber(stage.count)}</span>
                </div>
                <div className="mt-2 h-4 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${width}%` }}
                  />
                </div>
                <p className="mt-1 text-xs font-semibold text-text-muted">
                  So với bước trước: {formatRate(stage.count, previous)}
                </p>
              </div>
            );
          })}
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-control border border-border-soft bg-surface px-4 py-2 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
            href="/app/pipeline"
          >
            Mở pipeline
          </Link>
        </div>
      )}
    </ChartContainer>
  );
}
