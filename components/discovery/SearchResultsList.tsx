"use client";

import { SearchX } from "lucide-react";
import { PlaceResultCard } from "@/components/discovery/PlaceResultCard";
import type {
  DiscoveryPlaceResult,
  DiscoverySource,
} from "@/lib/providers/maps/types";

type SearchResultsListProps = {
  hoveredPlaceId?: string | null;
  loadingDetailsPlaceId?: string | null;
  onHoverPlace?: (placeId: string | null) => void;
  onLoadDetails: (place: DiscoveryPlaceResult) => void;
  onSave: (place: DiscoveryPlaceResult) => void;
  onSelectPlace?: (placeId: string) => void;
  results: DiscoveryPlaceResult[];
  savingPlaceId?: string | null;
  selectedPlaceId?: string | null;
  source: DiscoverySource;
};

export function SearchResultsList({
  hoveredPlaceId,
  loadingDetailsPlaceId,
  onHoverPlace,
  onLoadDetails,
  onSave,
  onSelectPlace,
  results,
  savingPlaceId,
  selectedPlaceId,
  source,
}: SearchResultsListProps) {
  if (results.length === 0) {
    const hint =
      source === "route_search"
        ? "Thử chọn một gợi ý tuyến đường khác, tăng độ lệch khỏi tuyến hoặc đổi keyword."
        : "Thử keyword rộng hơn, tăng bán kính hoặc chọn khu vực khác.";

    return (
      <section className="rounded-card border border-dashed border-border-strong bg-surface p-6 text-center shadow-card">
        <SearchX aria-hidden="true" className="mx-auto h-8 w-8 text-text-muted" />
        <h2 className="mt-3 text-xl font-bold text-text-primary">
          Chưa tìm thấy kết quả phù hợp
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
          {hint}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-card border border-border-soft bg-surface p-3 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <h2 className="text-sm font-bold text-text-primary">
          Danh sách kết quả
        </h2>
        <span className="text-xs font-bold text-text-muted">{results.length} địa điểm</span>
      </div>
      <div className="grid gap-3">
        {results.map((place, index) => (
          <PlaceResultCard
            detailsLoading={loadingDetailsPlaceId === place.placeId}
            hovered={hoveredPlaceId === place.placeId}
            index={index + 1}
            key={place.placeId}
            onHover={onHoverPlace}
            onLoadDetails={onLoadDetails}
            onSave={onSave}
            onSelect={onSelectPlace}
            place={place}
            saving={savingPlaceId === place.placeId}
            selected={selectedPlaceId === place.placeId}
            source={source}
          />
        ))}
      </div>
    </section>
  );
}
