import {
  Compass,
  LocateFixed,
  MapPinned,
  Route,
  Search,
  Sparkles,
} from "lucide-react";
import { DiscoverTabs } from "@/components/discovery/DiscoverTabs";
import { FirstRunTip } from "@/components/onboarding/FirstRunTip";
import { FeatureDisabledNotice } from "@/components/ui/FeatureDisabledNotice";
import { Badge } from "@/components/ui/Badge";
import { isFeatureEnabled } from "@/lib/data/feature-flags";
import { getActivationProgress } from "@/lib/data/onboarding";

export const dynamic = "force-dynamic";

type DiscoverPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const discoveryModes = [
  {
    icon: LocateFixed,
    label: "Quanh tôi",
    value: "Gần vị trí hiện tại",
  },
  {
    icon: MapPinned,
    label: "Theo khu vực",
    value: "Quận, phường, địa chỉ",
  },
  {
    icon: Route,
    label: "Dọc tuyến",
    value: "Điểm đầu -> điểm cuối",
  },
];

function getString(value?: string | string[]) {
  const text = Array.isArray(value) ? value[0] : value;

  return text?.trim() || "";
}

function getInitialTab(value?: string | string[]) {
  const tab = getString(value);

  if (tab === "area") return "area";
  if (tab === "route") return "route";
  return "near-me";
}

export default async function DiscoverPage(props: DiscoverPageProps) {
  const searchParams = await props.searchParams;
  const [mapDiscoveryEnabled, routeSearchEnabled] = await Promise.all([
    isFeatureEnabled("map_discovery"),
    isFeatureEnabled("route_search"),
  ]);
  const activation = await getActivationProgress().catch(() => null);
  const requestedTab = getInitialTab(searchParams?.tab);
  const initialTab =
    requestedTab === "route" && !routeSearchEnabled ? "near-me" : requestedTab;
  const initialKeyword = getString(searchParams?.keyword);

  return (
    <div className="mx-auto max-w-[1600px]">
      <section className="overflow-hidden rounded-shell border border-border-soft bg-surface shadow-card">
        <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <Badge tone="primary">
              <Compass aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
              Map Discovery
            </Badge>
            <h1 className="mt-4 text-2xl font-bold leading-tight text-text-primary sm:text-4xl">
              Khám phá khách mới
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
              Workspace tìm địa điểm, so sánh kết quả trên bản đồ và lưu lead
              để chăm sóc tiếp.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Badge tone={mapDiscoveryEnabled ? "success" : "warning"}>
              {mapDiscoveryEnabled ? "Map đang mở" : "Map chưa mở"}
            </Badge>
            <Badge tone={routeSearchEnabled ? "accent" : "outline"}>
              {routeSearchEnabled ? "Có route search" : "Route đang khóa"}
            </Badge>
            {initialKeyword ? (
              <Badge tone="outline">
                <Search aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
                {initialKeyword}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="grid border-t border-border-soft bg-background-subtle sm:grid-cols-3">
          {discoveryModes.map((item) => {
            const Icon = item.icon;

            return (
              <div
                className="flex items-center gap-3 border-b border-border-soft px-4 py-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
                key={item.label}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-surface text-primary shadow-sm">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-text-primary">{item.label}</p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-text-muted">
                    {item.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {!activation?.searched_map ? (
        <section className="mt-5 rounded-card border border-primary/20 bg-primary-soft p-4 shadow-card sm:p-5">
          <div className="flex gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-surface text-primary">
              <Sparkles aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-text-primary sm:text-lg">
                Lượt tìm bản đồ đầu tiên
              </h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-text-secondary">
                Bắt đầu với một ngành hàng cụ thể như nhà thuốc, quán ăn, spa
                hoặc đại lý.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <FirstRunTip
        message="Gợi ý keyword: nhà thuốc, quán ăn, đại lý, spa. Nếu ít kết quả, hãy tăng bán kính."
        storageKey="salemap:first-run-tip:discover"
      />

      {mapDiscoveryEnabled ? (
        <DiscoverTabs
          initialKeyword={initialKeyword}
          initialTab={initialTab}
          routeSearchEnabled={routeSearchEnabled}
        />
      ) : (
        <FeatureDisabledNotice flagKey="map_discovery" />
      )}
    </div>
  );
}
