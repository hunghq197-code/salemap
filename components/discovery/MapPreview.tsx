import { MapPinned, Route } from "lucide-react";
import type { DiscoveryPlaceResult } from "@/lib/providers/maps/types";

type MapPreviewProps = {
  center?: { latitude: number; longitude: number } | null;
  mode?: "places" | "route";
  results: DiscoveryPlaceResult[];
};

export function MapPreview({ center, mode = "places", results }: MapPreviewProps) {
  const isRoute = mode === "route";
  const Icon = isRoute ? Route : MapPinned;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex min-h-56 flex-col items-center justify-center rounded-lg bg-cloud px-4 py-8 text-center">
        <Icon aria-hidden="true" className="h-10 w-10 text-ocean" />
        <h2 className="mt-4 text-lg font-bold text-ink">
          {isRoute
            ? "Bản đồ tuyến đường sẽ được hiển thị tại đây."
            : "Bản đồ kết quả sẽ được hiển thị tại đây."}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600">
          MVP hiện ưu tiên danh sách kết quả dễ đọc trên mobile. Khi bật browser key, khu vực này có thể render tuyến/markers từ kết quả server.
        </p>
        <p className="mt-3 text-sm font-bold text-ocean">
          {results.length} địa điểm
          {!isRoute && center
            ? ` quanh ${center.latitude.toFixed(4)}, ${center.longitude.toFixed(4)}`
            : ""}
        </p>
      </div>
    </section>
  );
}
