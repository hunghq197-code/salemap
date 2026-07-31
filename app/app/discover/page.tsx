import { MapPinned } from "lucide-react";
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
  const activation = await getActivationProgress().catch(() => null);
  const requestedTab = getInitialTab(searchParams?.tab);
  const initialTab =
    requestedTab === "route" && !routeSearchEnabled ? "near-me" : requestedTab;

  return (
    <div className="mx-auto max-w-[1600px]">
      <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <Badge tone="primary">Khám phá địa điểm</Badge>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
            Tìm khách bằng Google Maps
          </h1>
          <p className="mt-3 max-w-4xl text-base leading-7 text-text-secondary">
            Quét khách quanh vị trí hiện tại, theo khu vực cụ thể hoặc dọc tuyến đường. Kết quả được đồng bộ với marker trên bản đồ và có thể lưu thành lead để chăm sóc tiếp.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-card border border-border-soft bg-surface p-2 text-center shadow-sm">
          {["Quanh tôi", "Khu vực", "Dọc tuyến"].map((item) => (
            <div className="rounded-control bg-surface-muted px-3 py-2" key={item}>
              <p className="text-xs font-bold text-text-muted">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {!activation?.searched_map ? (
        <section className="mt-5 rounded-card border border-primary/20 bg-surface p-5 shadow-card">
          <div className="flex gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
              <MapPinned aria-hidden="true" className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                Tìm khách hàng đầu tiên trên bản đồ
              </h2>
              <p className="mt-2 max-w-3xl text-base leading-7 text-text-secondary">
                Nhập ngành khách bạn muốn tìm, ví dụ nhà thuốc, quán ăn, đại lý vật liệu xây dựng, spa... SaleMap sẽ hiển thị kết quả quanh vị trí hoặc khu vực bạn chọn.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <FirstRunTip
        message="Gợi ý: hãy bắt đầu với keyword đơn giản như 'nhà thuốc', 'quán ăn', 'đại lý', sau đó tăng bán kính nếu kết quả ít."
        storageKey="salemap:first-run-tip:discover"
      />

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
