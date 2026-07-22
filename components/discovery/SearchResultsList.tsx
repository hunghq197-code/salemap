"use client";

import { PlaceResultCard } from "@/components/discovery/PlaceResultCard";
import type {
  DiscoveryPlaceResult,
  DiscoverySource,
} from "@/lib/providers/maps/types";

type SearchResultsListProps = {
  loadingDetailsPlaceId?: string | null;
  onLoadDetails: (place: DiscoveryPlaceResult) => void;
  onSave: (place: DiscoveryPlaceResult) => void;
  results: DiscoveryPlaceResult[];
  savingPlaceId?: string | null;
  source: DiscoverySource;
};

export function SearchResultsList({
  loadingDetailsPlaceId,
  onLoadDetails,
  onSave,
  results,
  savingPlaceId,
  source,
}: SearchResultsListProps) {
  if (results.length === 0) {
    const isRouteSearch = source === "route_search";

    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h2 className="text-xl font-bold text-ink">Không tìm thấy kết quả phù hợp.</h2>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-8 text-slate-600">
          {isRouteSearch
            ? "Hãy thử từ khóa khác hoặc tăng khoảng cách lệch tuyến."
            : "Hãy thử từ khóa khác hoặc tăng bán kính tìm kiếm."}
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((place) => (
        <PlaceResultCard
          detailsLoading={loadingDetailsPlaceId === place.placeId}
          key={place.placeId}
          onLoadDetails={onLoadDetails}
          onSave={onSave}
          place={place}
          saving={savingPlaceId === place.placeId}
          source={source}
        />
      ))}
    </div>
  );
}
