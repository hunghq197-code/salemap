import Link from "next/link";
import { ChartContainer } from "@/components/analytics/ChartContainer";
import { ChartEmptyState } from "@/components/analytics/ChartEmptyState";
import type { PipelineFunnel } from "@/lib/analytics/sales-analytics";

type PipelineDistributionProps = {
  error?: boolean;
  funnel: PipelineFunnel;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value)}%`;
}

export function PipelineDistribution({ error = false, funnel }: PipelineDistributionProps) {
  const total = funnel.stages[0]?.count ?? 0;

  return (
    <ChartContainer
      description="Tỷ trọng lead theo stage pipeline trong kỳ đang xem."
      error={error}
      title="Phân bố pipeline"
    >
      {total === 0 ? (
        <ChartEmptyState
          actionHref="/app/pipeline"
          actionLabel="Mở pipeline"
          message="Chưa có lead trong pipeline cho khoảng thời gian đã chọn."
          title="Chưa có phân bố pipeline"
        />
      ) : (
        <div className="space-y-3">
          {funnel.stages.map((stage) => {
            const share = total > 0 ? (stage.count / total) * 100 : 0;

            return (
              <div
                className="grid gap-2 rounded-control border border-border-soft bg-surface-muted p-3 sm:grid-cols-[140px_1fr_90px] sm:items-center"
                key={stage.key}
              >
                <p className="font-bold text-text-primary">{stage.label}</p>
                <div className="h-2.5 overflow-hidden rounded-full bg-surface">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(4, share)}%` }} />
                </div>
                <p className="text-sm font-bold text-text-secondary">
                  {formatNumber(stage.count)} · {formatPercent(share)}
                </p>
              </div>
            );
          })}
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-control border border-border-soft bg-surface px-4 py-2 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
            href="/app/pipeline"
          >
            Xem pipeline
          </Link>
        </div>
      )}
    </ChartContainer>
  );
}
