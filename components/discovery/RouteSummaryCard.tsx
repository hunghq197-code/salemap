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
  if (!value) {
    return "Chưa có";
  }

  return value >= 1000 ? `${(value / 1000).toFixed(1)}km` : `${value}m`;
}

function formatDuration(value?: number) {
  if (!value) {
    return "Chưa có";
  }

  const minutes = Math.max(1, Math.round(value / 60));

  return `${minutes} phút`;
}

export function RouteSummaryCard({ count, quota, route }: RouteSummaryCardProps) {
  const isStreetRoute = route.mode === "street" && Boolean(route.streetText);
  const routeTitle = isStreetRoute
    ? `Tuyến đường: ${route.streetText}`
    : `Tuyến: ${route.originText} → ${route.destinationText}`;

  return (
    <section className="rounded-lg border border-ocean/20 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-ocean">
            <Route aria-hidden="true" className="h-4 w-4" />
            Dọc tuyến
          </p>
          <h2 className="mt-3 text-xl font-bold leading-7 text-ink">
            {routeTitle}
          </h2>
          <p className="mt-2 text-base leading-7 text-slate-600">
            {isStreetRoute
              ? `Tìm thấy ${count} khách quanh tuyến đường/vùng quét này.`
              : `Tìm thấy ${count} khách gần tuyến đường này.`}
          </p>
        </div>

        {quota ? (
          <div className="rounded-lg bg-cloud px-4 py-3 text-sm font-bold text-ocean">
            Còn {quota.remaining}/{quota.limit} lượt tìm tuyến hôm nay
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-lg bg-cloud px-4 py-3">
          <MapPinned aria-hidden="true" className="h-5 w-5 text-ocean" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              {isStreetRoute ? "Độ dài ước tính" : "Khoảng cách"}
            </p>
            <p className="mt-1 text-base font-bold text-ink">
              {formatDistance(route.distanceMeters)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-cloud px-4 py-3">
          <Clock3 aria-hidden="true" className="h-5 w-5 text-ocean" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Thời gian dự kiến
            </p>
            <p className="mt-1 text-base font-bold text-ink">
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
