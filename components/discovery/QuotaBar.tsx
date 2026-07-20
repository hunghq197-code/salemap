import type { DiscoveryQuota } from "@/lib/providers/maps/types";
import { QuotaWarning } from "@/components/quota/QuotaWarning";

type QuotaBarProps = {
  count: number;
  quota?: DiscoveryQuota | null;
};

export function QuotaBar({ count, quota }: QuotaBarProps) {
  if (!quota) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-base font-bold text-ink">Tìm thấy {count} khách phù hợp</p>
        <p className="text-sm font-bold text-ocean">
          Còn {quota.remaining}/{quota.limit} lượt tìm hôm nay
        </p>
      </div>
      <QuotaWarning
        actionType={quota.actionType}
        className="mt-3"
        limit={quota.limit}
        remaining={quota.remaining}
        used={quota.used}
      />
    </div>
  );
}
