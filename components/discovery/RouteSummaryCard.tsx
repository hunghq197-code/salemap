import { Clock3, MapPinned, Route } from "lucide-react";
import { QuotaWarning } from "@/components/quota/QuotaWarning";
import type {
  DiscoveryQuota,
  DiscoveryRouteResult,
} from "@/lib/providers/maps/types";

type RouteSummaryCardProps = {
  count: number;
  quota?: DiscoveryQuota | null;
  route: DiscoveryRouteResult;
};

function formatDistance(value?: number) {
  if (!value) return "Chưa có";

  return value >= 1000 ? `${(value / 1000).toFixed(1)}km` : `${value}m`;
}

function formatDuration(value?: number) {
  if (!value) return "Chưa có";

  const minutes = Math.max(1, Math.round(value / 60));

  return `${minutes} phút`;
}

export function RouteSummaryCard({ count, quota, route }: RouteSummaryCardProps) {
  const isStreetRoute = route.mode === "street" && Boolean(route.streetText);
  const routeTitle = isStreetRoute
    ? `Tuyến đường: ${route.streetText}`
    : `Tuyến: ${route.originText} -> ${route.destinationText}`;

  return (
    <section className="rounded-card border border-primary/20 bg-surface p-5 shadow-card">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-primary">
            <Route aria-hidden="true" className="h-4 w-4" />
            Dọc tuyến
          </p>
          <h2 className="mt-3 text-xl font-bold leading-7 text-text-primary">
            {routeTitle}
          </h2>
          <p className="mt-2 text-base leading-7 text-text-secondary">
            {isStreetRoute
              ? `Tìm thấy ${count} khách quanh tuyến đường/vùng quét này.`
              : `Tìm thấy ${count} khách gần tuyến đường này.`}
          </p>
        </div>

        {quota ? (
          <div className="rounded-control bg-primary-soft px-4 py-3 text-sm font-bold text-primary">
            Còn {quota.remaining}/{quota.limit} lượt tìm tuyến hôm nay
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-control bg-surface-muted px-4 py-3">
          <MapPinned aria-hidden="true" className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
              {isStreetRoute ? "Độ dài ước tính" : "Khoảng cách"}
            </p>
            <p className="mt-1 text-base font-bold text-text-primary">
              {formatDistance(route.distanceMeters)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-control bg-surface-muted px-4 py-3">
          <Clock3 aria-hidden="true" className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
              Thời gian dự kiến
            </p>
            <p className="mt-1 text-base font-bold text-text-primary">
              {formatDuration(route.durationSeconds)}
            </p>
          </div>
        </div>
      </div>

      {quota ? (
        <QuotaWarning
          actionType={quota.actionType}
          className="mt-4"
          limit={quota.limit}
          remaining={quota.remaining}
          used={quota.used}
        />
      ) : null}
    </section>
  );
}
