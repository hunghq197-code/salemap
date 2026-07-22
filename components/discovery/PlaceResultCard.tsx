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
} from "lucide-react";
import Link from "next/link";
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
  if (!value) {
    return null;
  }

  return value >= 1000 ? `${(value / 1000).toFixed(1)}km` : `${value}m`;
}

function formatCategory(value?: string) {
  if (!value) {
    return null;
  }

  return categoryLabels[value] || value.replaceAll("_", " ");
}

export function PlaceResultCard({
  detailsLoading,
  hovered = false,
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
      className={[
        "rounded-lg border bg-white p-4 shadow-sm transition",
        selected
          ? "border-ocean ring-2 ring-ocean/20"
          : hovered
            ? "border-emerald-300"
            : "border-slate-200",
      ].join(" ")}
      data-discovery-place-card
      data-place-id={place.placeId}
      onClick={() => onSelect?.(place.placeId)}
      onFocus={() => onHover?.(place.placeId)}
      onMouseEnter={() => onHover?.(place.placeId)}
      onMouseLeave={() => onHover?.(null)}
      tabIndex={0}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-7 text-ink">{place.name}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-600">
            {categoryLabel ? (
              <span className="rounded-full bg-cloud px-3 py-1 text-xs font-bold text-ocean">
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
            {distance ? <span>{distance}</span> : null}
          </div>
          {source === "route_search" ? (
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
              {routeDistance ? (
                <span className="rounded-full bg-ocean/10 px-3 py-1 text-ocean">
                  Cách tuyến khoảng {routeDistance}
                </span>
              ) : null}
              {originDistance ? (
                <span className="rounded-full bg-cloud px-3 py-1">
                  Cách điểm xuất phát khoảng {originDistance}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        {place.isSaved ? (
          place.savedLeadId ? (
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-mint px-4 py-2 text-sm font-bold text-ink hover:bg-[#5de0b3]"
              href={`/app/leads/${place.savedLeadId}`}
              onClick={(event) => event.stopPropagation()}
            >
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
              Xem lead
            </Link>
          ) : (
            <span className="inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
              Đã có trong lead
            </span>
          )
        ) : (
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ocean disabled:cursor-not-allowed disabled:opacity-70"
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

      {place.address ? (
        <p className="mt-3 flex items-start gap-2 text-sm leading-7 text-slate-600">
          <MapPin
            aria-hidden="true"
            className="mt-1 h-4 w-4 flex-none text-ocean"
          />
          <span>{place.address}</span>
        </p>
      ) : null}
      {place.phone ? (
        <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
          <Phone aria-hidden="true" className="h-4 w-4 text-ocean" />
          {place.phone}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {!place.detailsLoaded ? (
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink hover:border-ocean hover:text-ocean disabled:cursor-not-allowed disabled:opacity-70"
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
            {detailsLoading ? "Đang tải..." : "Xem thông tin liên hệ"}
          </button>
        ) : null}
        {directionsUrl ? (
          <a
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink hover:border-ocean hover:text-ocean"
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
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink hover:border-ocean hover:text-ocean"
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
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink hover:border-ocean hover:text-ocean"
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
    </article>
  );
}
