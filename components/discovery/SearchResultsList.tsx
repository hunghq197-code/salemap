"use client";

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
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h2 className="text-xl font-bold text-ink">
          Không tìm thấy địa điểm phù hợp.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-8 text-slate-600">
          Hãy thử keyword khác, tăng bán kính hoặc đổi khu vực.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((place) => (
        <PlaceResultCard
          detailsLoading={loadingDetailsPlaceId === place.placeId}
          hovered={hoveredPlaceId === place.placeId}
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
  );
}
