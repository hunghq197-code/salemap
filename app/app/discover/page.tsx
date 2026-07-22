import { DiscoverTabs } from "@/components/discovery/DiscoverTabs";
import { FeatureDisabledNotice } from "@/components/ui/FeatureDisabledNotice";
import { isFeatureEnabled } from "@/lib/data/feature-flags";

export const dynamic = "force-dynamic";

type DiscoverPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getInitialTab(value?: string | string[]) {
  const tab = Array.isArray(value) ? value[0] : value;

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
  const requestedTab = getInitialTab(searchParams?.tab);
  const initialTab =
    requestedTab === "route" && !routeSearchEnabled ? "near-me" : requestedTab;

  return (
    <div className="mx-auto max-w-7xl">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
        Khám phá địa điểm
      </p>
      <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">
        Tìm khách bằng Google Maps
      </h1>
      <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
        Quét khách quanh vị trí hiện tại, theo khu vực cụ thể hoặc dọc tuyến đường. Kết quả được hiển thị bằng marker trên bản đồ và có thể lưu thành lead để chăm sóc tiếp.
      </p>

      {mapDiscoveryEnabled ? (
        <DiscoverTabs
          initialTab={initialTab}
          routeSearchEnabled={routeSearchEnabled}
        />
      ) : (
        <FeatureDisabledNotice flagKey="map_discovery" />
      )}
    </div>
  );
}
