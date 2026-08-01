import { ChartContainer } from "@/components/analytics/ChartContainer";
import { ChartEmptyState } from "@/components/analytics/ChartEmptyState";
import type { DailyTrendItem } from "@/lib/analytics/sales-analytics";

type ActivityTrendChartProps = {
  error?: boolean;
  trends: DailyTrendItem[];
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${value}T00:00:00`));
}

export function ActivityTrendChart({ error = false, trends }: ActivityTrendChartProps) {
  const totals = trends.map((item) => item.leadsCreated + item.followupsCompleted + item.leadsWon);
  const maxTotal = Math.max(1, ...totals);
  const totalActivity = totals.reduce((sum, value) => sum + value, 0);

  return (
    <ChartContainer
      description="Theo dõi lead mới, follow-up hoàn thành và lead won theo ngày."
      error={error}
      title="Hoạt động theo thời gian"
    >
      {totalActivity === 0 ? (
        <ChartEmptyState
          actionHref="/app/discover"
          actionLabel="Tìm khách đầu tiên"
          message="Không có hoạt động trong khoảng thời gian đã chọn."
          title="Chưa có dữ liệu cho biểu đồ"
        />
      ) : (
        <div>
          <p className="sr-only">
            Tổng hoạt động trong khoảng này là {formatNumber(totalActivity)} gồm lead mới,
            follow-up hoàn thành và lead won.
          </p>
          <div className="space-y-3">
            {trends.map((item) => {
              const total = item.leadsCreated + item.followupsCompleted + item.leadsWon;
              const width = Math.max(4, (total / maxTotal) * 100);

              return (
                <div className="grid gap-2 md:grid-cols-[88px_minmax(0,1fr)_220px]" key={item.date}>
                  <p className="text-sm font-bold text-text-secondary">
                    {formatDateLabel(item.date)}
                  </p>
                  <div className="h-8 overflow-hidden rounded-control bg-surface-muted">
                    <div className="flex h-full rounded-control" style={{ width: `${width}%` }}>
                      <span
                        aria-hidden="true"
                        className="h-full bg-primary"
                        style={{
                          width: `${total > 0 ? (item.leadsCreated / total) * 100 : 0}%`,
                        }}
                      />
                      <span
                        aria-hidden="true"
                        className="h-full bg-success"
                        style={{
                          width: `${total > 0 ? (item.followupsCompleted / total) * 100 : 0}%`,
                        }}
                      />
                      <span
                        aria-hidden="true"
                        className="h-full bg-accent"
                        style={{
                          width: `${total > 0 ? (item.leadsWon / total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-sm font-semibold leading-6 text-text-secondary">
                    {item.leadsCreated} lead · {item.followupsCompleted} follow-up · {item.leadsWon} won
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap gap-3 text-xs font-bold text-text-secondary">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Lead mới
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-success" /> Follow-up hoàn thành
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-accent" /> Lead won
            </span>
          </div>
        </div>
      )}
    </ChartContainer>
  );
}
