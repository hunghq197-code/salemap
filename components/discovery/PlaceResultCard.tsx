"use client";

import {
  CheckCircle2,
  ExternalLink,
  Globe,
  Info,
  LoaderCircle,
  MapPin,
  Navigation,
  Phone,
  Save,
  Star,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackMapEvent } from "@/lib/analytics/client";
import { getGoogleMapsDirectionsUrl } from "@/lib/maps-url";
import type {
  DiscoveryPlaceResult,
  DiscoverySource,
} from "@/lib/providers/maps/types";

type PlaceResultCardProps = {
  detailsLoading: boolean;
  hovered?: boolean;
  index: number;
  onHover?: (placeId: string | null) => void;
  onLoadDetails: (place: DiscoveryPlaceResult) => void;
  onSave: (place: DiscoveryPlaceResult) => void;
  onSelect?: (placeId: string) => void;
  place: DiscoveryPlaceResult;
  saving: boolean;
  selected?: boolean;
  source: DiscoverySource;
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

function formatDistance(value?: number) {
  if (!value) return null;

  return value >= 1000 ? `${(value / 1000).toFixed(1)}km` : `${value}m`;
}

function formatCategory(value?: string) {
  if (!value) return null;

  return categoryLabels[value] || value.replaceAll("_", " ");
}

export function PlaceResultCard({
  detailsLoading,
  hovered = false,
  index,
  onHover,
  onLoadDetails,
  onSave,
  onSelect,
  place,
  saving,
  selected = false,
  source,
}: PlaceResultCardProps) {
  const distance = formatDistance(place.distanceMeters);
  const routeDistance = formatDistance(place.distanceFromRouteMeters);
  const originDistance = formatDistance(place.distanceFromOriginMeters);
  const categoryLabel = formatCategory(place.category);
  const directionsUrl = getGoogleMapsDirectionsUrl({
    address: place.address,
    googleMapsUrl: place.googleMapsUrl,
    latitude: place.latitude,
    longitude: place.longitude,
    placeId: place.placeId,
  });

  const safeProperties = {
    category: place.category,
    hasPhone: Boolean(place.phone),
    hasWebsite: Boolean(place.website),
    source,
  };
  const directionEvent =
    source === "route_search"
      ? ANALYTICS_EVENTS.ROUTE_DIRECTIONS_CLICKED
      : ANALYTICS_EVENTS.MAP_DIRECTIONS_CLICKED;
  const callEvent =
    source === "route_search"
      ? ANALYTICS_EVENTS.ROUTE_CALL_CLICKED
      : ANALYTICS_EVENTS.MAP_CALL_CLICKED;
  const websiteEvent =
    source === "route_search"
      ? ANALYTICS_EVENTS.ROUTE_WEBSITE_CLICKED
      : ANALYTICS_EVENTS.MAP_WEBSITE_CLICKED;

  return (
    <article
      aria-current={selected ? "true" : undefined}
      className={[
        "rounded-card border bg-surface p-3 transition sm:p-4",
        selected
          ? "border-primary bg-primary-soft/50 ring-2 ring-primary/15"
          : hovered
            ? "border-accent"
            : "border-border-soft hover:border-primary/40",
      ].join(" ")}
      data-discovery-place-card
      data-place-id={place.placeId}
      onClick={() => onSelect?.(place.placeId)}
      onFocus={() => onHover?.(place.placeId)}
      onMouseEnter={() => onHover?.(place.placeId)}
      onMouseLeave={() => onHover?.(null)}
      tabIndex={0}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar text-xs font-black text-white">
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-base font-bold leading-6 text-text-primary">
                {place.name}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-text-secondary">
                {categoryLabel ? <Badge tone="primary">{categoryLabel}</Badge> : null}
                {place.isSaved ? (
                  <Badge tone="success">
                    <CheckCircle2 aria-hidden="true" className="mr-1 h-3.5 w-3.5" />
                    Đã lưu
                  </Badge>
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
                {distance ? <span>{distance}</span> : null}
              </div>
            </div>

            {place.isSaved ? (
              place.savedLeadId ? (
                <Link
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-control bg-success px-3 py-2 text-sm font-bold text-white transition hover:bg-emerald-600"
                  href={`/app/leads/${place.savedLeadId}`}
                  onClick={(event) => event.stopPropagation()}
                >
                  <ExternalLink aria-hidden="true" className="h-4 w-4" />
                  Xem lead
                </Link>
              ) : (
                <span className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-control bg-success-soft px-3 py-2 text-sm font-bold text-emerald-700">
                  Đã có lead
                </span>
              )
            ) : (
              <button
                aria-busy={saving || undefined}
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-control bg-primary px-3 py-2 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
                disabled={saving}
                onClick={(event) => {
                  event.stopPropagation();
                  onSave(place);
                }}
                type="button"
              >
                <Save aria-hidden="true" className="h-4 w-4" />
                {saving ? "Đang lưu..." : "Lưu lead"}
              </button>
            )}
          </div>

          {source === "route_search" ? (
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-text-secondary">
              {routeDistance ? (
                <span className="rounded-full bg-primary-soft px-3 py-1 text-primary">
                  Cách tuyến khoảng {routeDistance}
                </span>
              ) : null}
              {originDistance ? (
                <span className="rounded-full bg-surface-muted px-3 py-1">
                  Cách điểm xuất phát khoảng {originDistance}
                </span>
              ) : null}
            </div>
          ) : null}

          {place.address ? (
            <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-text-secondary">
              <MapPin
                aria-hidden="true"
                className="mt-1 h-4 w-4 flex-none text-primary"
              />
              <span className="line-clamp-2">{place.address}</span>
            </p>
          ) : null}
          {place.phone ? (
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-text-secondary">
              <Phone aria-hidden="true" className="h-4 w-4 text-primary" />
              {place.phone}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            {!place.detailsLoaded ? (
              <button
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-3 py-2 text-xs font-bold text-text-primary transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-70"
                disabled={detailsLoading || saving}
                onClick={(event) => {
                  event.stopPropagation();
                  onLoadDetails(place);
                }}
                type="button"
              >
                {detailsLoading ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin"
                  />
                ) : (
                  <Info aria-hidden="true" className="h-4 w-4" />
                )}
                {detailsLoading ? "Đang tải..." : "Xem liên hệ"}
              </button>
            ) : null}
            {directionsUrl ? (
              <a
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-3 py-2 text-xs font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
                href={directionsUrl}
                onClick={(event) => {
                  event.stopPropagation();
                  trackMapEvent(directionEvent, safeProperties);
                }}
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
                onClick={(event) => {
                  event.stopPropagation();
                  trackMapEvent(callEvent, safeProperties);
                }}
              >
                <Phone aria-hidden="true" className="h-4 w-4" />
                Gọi
              </a>
            ) : null}
            {place.website ? (
              <a
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-3 py-2 text-xs font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
                href={place.website}
                onClick={(event) => {
                  event.stopPropagation();
                  trackMapEvent(websiteEvent, safeProperties);
                }}
                rel="noreferrer"
                target="_blank"
              >
                <Globe aria-hidden="true" className="h-4 w-4" />
                Website
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
