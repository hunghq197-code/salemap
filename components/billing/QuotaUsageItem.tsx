import type { DailyQuotaAction } from "@/lib/constants/quota";
import { DAILY_QUOTA_LABELS } from "@/lib/constants/quota";

type QuotaUsageItemProps = {
  actionType: DailyQuotaAction | string;
  limit: number;
  remaining: number;
  used: number;
};

function percent(used: number, limit: number) {
  if (limit <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((used / limit) * 100));
}

export function QuotaUsageItem({
  actionType,
  limit,
  remaining,
  used,
}: QuotaUsageItemProps) {
  const label = DAILY_QUOTA_LABELS[actionType as DailyQuotaAction] ?? {
    label: actionType,
    shortLabel: actionType,
    unit: "lượt",
  };
  const usagePercent = percent(used, limit);
  const isBlocked = limit <= 0;
  const isLow = !isBlocked && remaining <= Math.ceil(limit * 0.2);

  return (
    <article className="rounded-control border border-border-soft bg-surface px-4 py-3">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-bold text-text-primary">{label.shortLabel}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-text-secondary">
            {isBlocked ? "Chưa bật trong gói này" : `Còn ${remaining} ${label.unit}`}
          </p>
        </div>
        <p className="shrink-0 text-sm font-bold text-primary">
          {used}/{limit}
        </p>
      </div>
      <div
        aria-label={`${label.label}: đã dùng ${used} trên ${limit}`}
        className="mt-3 h-2 overflow-hidden rounded-full bg-border-soft"
        role="progressbar"
        aria-valuemax={limit}
        aria-valuemin={0}
        aria-valuenow={Math.min(used, limit)}
      >
        <div
          className={[
            "h-full rounded-full transition-all",
            isBlocked ? "bg-border-strong" : isLow ? "bg-warning" : "bg-primary",
          ].join(" ")}
          style={{ width: `${usagePercent}%` }}
        />
      </div>
    </article>
  );
}
