"use client";

import {
  ExternalLink,
  Globe,
  Info,
  LoaderCircle,
  MapPin,
  Navigation,
  Phone,
  Save,
  Star,
  X,
} from "lucide-react";
import Link from "next/link";
import { IconButton } from "@/components/ui/IconButton";
import { getGoogleMapsDirectionsUrl } from "@/lib/maps-url";
import type { DiscoveryPlaceResult } from "@/lib/providers/maps/types";

type PlaceDetailPanelProps = {
  detailsLoading: boolean;
  onClose: () => void;
  onLoadDetails: (place: DiscoveryPlaceResult) => void;
  onSave: (place: DiscoveryPlaceResult) => void;
  place: DiscoveryPlaceResult;
  saving: boolean;
};

const categoryLabels: Record<string, string> = {
  auto_parts_store: "Phụ tùng / dầu nhớt",
  beauty_salon: "Spa / salon",
  car_repair: "Sửa xe",
  car_wash: "Rửa xe",
  doctor: "Phòng khám",
  electronics_store: "Điện máy",
  grocery_or_supermarket: "Tạp hóa / siêu thị",
  hardware_store: "Cửa hàng vật liệu",
  pharmacy: "Nhà thuốc",
  restaurant: "Quán ăn",
  store: "Cửa hàng",
};

function formatCategory(value?: string) {
  if (!value) return null;

  return categoryLabels[value] || value.replaceAll("_", " ");
}

export function PlaceDetailPanel({
  detailsLoading,
  onClose,
  onLoadDetails,
  onSave,
  place,
  saving,
}: PlaceDetailPanelProps) {
  const categoryLabel = formatCategory(place.category);
  const directionsUrl = getGoogleMapsDirectionsUrl({
    address: place.address,
    googleMapsUrl: place.googleMapsUrl,
    latitude: place.latitude,
    longitude: place.longitude,
    placeId: place.placeId,
  });

  return (
    <aside className="fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-[55] max-h-[48vh] overflow-y-auto rounded-card border border-border-soft bg-surface p-4 shadow-modal lg:absolute lg:bottom-4 lg:left-auto lg:right-4 lg:top-auto lg:max-h-[calc(100%-6rem)] lg:w-[360px]">
      <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border-strong lg:hidden" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
            Địa điểm đã chọn
          </p>
          <h2 className="mt-1 text-lg font-bold leading-7 text-text-primary">
            {place.name}
          </h2>
        </div>
        <IconButton
          icon={<X aria-hidden="true" className="h-4 w-4" />}
          label="Đóng chi tiết địa điểm"
          onClick={onClose}
          size="sm"
          variant="ghost"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-text-secondary">
        {categoryLabel ? (
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
            {categoryLabel}
          </span>
        ) : null}
        {place.rating ? (
          <span className="inline-flex items-center gap-1">
            <Star
              aria-hidden="true"
              className="h-4 w-4 fill-amber-400 text-amber-400"
            />
            {place.rating}
            {place.userRatingsTotal ? ` (${place.userRatingsTotal})` : ""}
          </span>
        ) : null}
      </div>

      {place.address ? (
        <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-text-secondary">
          <MapPin aria-hidden="true" className="mt-1 h-4 w-4 flex-none text-primary" />
          <span>{place.address}</span>
        </p>
      ) : null}

      {place.phone ? (
        <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-text-secondary">
          <Phone aria-hidden="true" className="h-4 w-4 text-primary" />
          {place.phone}
        </p>
      ) : null}

      <div className="mt-4 grid gap-2">
        {place.isSaved ? (
          place.savedLeadId ? (
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-success px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-600"
              href={`/app/leads/${place.savedLeadId}`}
            >
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
              Xem lead
            </Link>
          ) : (
            <span className="inline-flex min-h-11 items-center justify-center rounded-control bg-success-soft px-4 py-2 text-sm font-bold text-emerald-700">
              Đã có trong lead
            </span>
          )
        ) : (
          <button
            aria-busy={saving || undefined}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
            disabled={saving}
            onClick={() => onSave(place)}
            type="button"
          >
            <Save aria-hidden="true" className="h-4 w-4" />
            {saving ? "Đang lưu..." : "Lưu làm lead"}
          </button>
        )}

        <div className="grid grid-cols-2 gap-2">
          {!place.detailsLoaded ? (
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-3 py-2 text-xs font-bold text-text-primary transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-70"
              disabled={detailsLoading || saving}
              onClick={() => onLoadDetails(place)}
              type="button"
            >
              {detailsLoading ? (
                <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Info aria-hidden="true" className="h-4 w-4" />
              )}
              Liên hệ
            </button>
          ) : null}
          {directionsUrl ? (
            <a
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-3 py-2 text-xs font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
              href={directionsUrl}
              rel="noreferrer"
              target="_blank"
            >
              <Navigation aria-hidden="true" className="h-4 w-4" />
              Chỉ đường
            </a>
          ) : null}
          {place.phone ? (
            <a
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-3 py-2 text-xs font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
              href={`tel:${place.phone}`}
            >
              <Phone aria-hidden="true" className="h-4 w-4" />
              Gọi
            </a>
          ) : null}
          {place.website ? (
            <a
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-3 py-2 text-xs font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
              href={place.website}
              rel="noreferrer"
              target="_blank"
            >
              <Globe aria-hidden="true" className="h-4 w-4" />
              Website
            </a>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
