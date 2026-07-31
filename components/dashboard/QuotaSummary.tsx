import { AlertTriangle, Gauge } from "lucide-react";
import Link from "next/link";
import { DAILY_QUOTA_LABELS, type DailyQuotaAction } from "@/lib/constants/quota";
import type { DailyUsage } from "@/lib/data/usage";

type QuotaSummaryProps = {
  items: DailyUsage[];
  planName?: string;
  schemaReady?: boolean;
};

function getPercent(used: number, limit: number) {
  if (limit <= 0) return 0;

  return Math.min(100, Math.round((used / limit) * 100));
}

function getLabel(actionType: string) {
  return DAILY_QUOTA_LABELS[actionType as DailyQuotaAction] ?? {
    label: actionType,
    shortLabel: actionType,
    unit: "lượt",
  };
}

export function QuotaSummary({
  items,
  planName,
  schemaReady = true,
}: QuotaSummaryProps) {
  const lowQuota = items.some((item) => item.remaining <= Math.ceil(item.limit * 0.2));

  return (
    <section className="rounded-card border border-border-soft bg-surface p-4 shadow-card sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
          <Gauge aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-text-primary">Hạn mức hôm nay</h2>
          {planName ? (
            <p className="mt-1 text-sm font-semibold text-text-secondary">
              Gói hiện tại: {planName}
            </p>
          ) : null}
        </div>
      </div>

      {!schemaReady ? (
        <p className="mt-4 rounded-control border border-warning/25 bg-warning-soft px-3 py-2 text-sm font-semibold leading-6 text-amber-700">
          Chưa bật bảng quota trong Supabase. SaleMap đang hiển thị hạn mức mặc định.
        </p>
      ) : null}

      <div className="mt-4 grid gap-3">
        {items.map((item) => {
          const label = getLabel(item.actionType);
          const percent = getPercent(item.used, item.limit);
          const isLow = item.remaining <= Math.ceil(item.limit * 0.2);

          return (
            <div key={item.actionType}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-bold text-text-primary">{label.shortLabel}</span>
                <span className={isLow ? "font-bold text-amber-700" : "font-bold text-text-secondary"}>
                  {item.used}/{item.limit}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className={isLow ? "h-full rounded-full bg-warning" : "h-full rounded-full bg-primary"}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-1 text-xs font-semibold text-text-muted">
                Còn {item.remaining} {label.unit}
              </p>
            </div>
          );
        })}
      </div>

      {lowQuota ? (
        <div className="mt-4 flex items-start gap-2 rounded-control border border-warning/25 bg-warning-soft px-3 py-2 text-sm font-semibold leading-6 text-amber-700">
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 flex-none" />
          <p>Một vài hạn mức sắp hết. Bạn có thể xem lại gói trước khi tiếp tục mở rộng tìm kiếm.</p>
        </div>
      ) : null}

      <Link
        className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-control border border-border-soft bg-surface px-4 py-2 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
        href="/app/billing"
      >
        Xem gói dịch vụ
      </Link>
    </section>
  );
}
