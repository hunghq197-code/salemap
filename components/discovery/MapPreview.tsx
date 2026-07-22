"use client";

import { AlertTriangle, MapPinned, RotateCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  GOOGLE_MAPS_AUTH_ERROR_MESSAGE,
  GoogleMapsAuthError,
  loadGoogleMaps,
  setGoogleMapsAuthFailureHandler,
} from "@/lib/google-maps/load-google-maps";
import type { DiscoveryPlaceResult } from "@/lib/providers/maps/types";

type MapPoint = {
  latitude: number;
  longitude: number;
};

type RouteEndpoint = {
  latitude?: number;
  longitude?: number;
  text?: string;
};

type MapPreviewProps = {
  center?: MapPoint | null;
  hoveredPlaceId?: string | null;
  mode?: "places" | "route";
  onMarkerClick?: (placeId: string) => void;
  onSearchThisArea?: (center: MapPoint) => void;
  onViewportCenterChange?: (center: MapPoint) => void;
  results: DiscoveryPlaceResult[];
  routeDestination?: RouteEndpoint | null;
  routeOrigin?: RouteEndpoint | null;
  routePolyline?: string;
  searchThisAreaLoading?: boolean;
  searchThisAreaVisible?: boolean;
  selectedPlaceId?: string | null;
  showCenterMarker?: boolean;
};

type MarkerData = {
  address?: string;
  latitude: number;
  longitude: number;
  name: string;
  placeId: string;
};

function buildInfoWindowContent(place: MarkerData) {
  const wrapper = document.createElement("div");
  wrapper.className = "salemap-map-info";

  const title = document.createElement("strong");
  title.textContent = place.name;
  wrapper.appendChild(title);

  if (place.address) {
    const address = document.createElement("p");
    address.textContent = place.address;
    wrapper.appendChild(address);
  }

  return wrapper;
}

function toLatLngLiteral(point?: RouteEndpoint | null) {
  if (point?.latitude == null || point.longitude == null) {
    return null;
  }

  return { lat: point.latitude, lng: point.longitude };
}

function getPlaceMarkerIcon(variant: "default" | "hovered" | "selected") {
  const fillColor =
    variant === "selected"
      ? "#0f172a"
      : variant === "hovered"
        ? "#16a34a"
        : "#0284c7";

  return {
    fillColor,
    fillOpacity: 1,
    path: google.maps.SymbolPath.CIRCLE,
    scale: variant === "default" ? 12 : 15,
    strokeColor: "#ffffff",
    strokeWeight: 3,
  };
}

export function MapPreview({
  center,
  hoveredPlaceId,
  mode = "places",
  onMarkerClick,
  onSearchThisArea,
  onViewportCenterChange,
  results,
  routeDestination,
  routeOrigin,
  routePolyline,
  searchThisAreaLoading = false,
  searchThisAreaVisible = false,
  selectedPlaceId,
  showCenterMarker = false,
}: MapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const centerMarkerRef = useRef<google.maps.Marker | null>(null);
  const endpointMarkersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const initialCenterRef = useRef(center);
  const onMarkerClickRef = useRef(onMarkerClick);
  const onViewportCenterChangeRef = useRef(onViewportCenterChange);
  const routeRef = useRef<google.maps.Polyline | null>(null);
  const [error, setError] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [viewportCenter, setViewportCenter] = useState<MapPoint | null>(
    center ?? null,
  );

  const markerData = useMemo(
    () =>
      results.flatMap<MarkerData>((place) =>
        place.latitude != null && place.longitude != null
          ? [
              {
                address: place.address,
                latitude: place.latitude,
                longitude: place.longitude,
                name: place.name,
                placeId: place.placeId,
              },
            ]
          : [],
      ),
    [results],
  );

  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  useEffect(() => {
    onViewportCenterChangeRef.current = onViewportCenterChange;
  }, [onViewportCenterChange]);

  useEffect(() => {
    let active = true;
    const markerStore = markersRef.current;

    async function initializeMap() {
      if (!containerRef.current) {
        return;
      }

      try {
        setGoogleMapsAuthFailureHandler(() => {
          if (!active) return;

          setMapReady(false);
          setError(GOOGLE_MAPS_AUTH_ERROR_MESSAGE);
        });
        await loadGoogleMaps();

        if (!active || !containerRef.current) {
          return;
        }

        const map = new google.maps.Map(containerRef.current, {
          backgroundColor: "#eef4f8",
          center: {
            lat: initialCenterRef.current?.latitude ?? 10.7769,
            lng: initialCenterRef.current?.longitude ?? 106.7009,
          },
          clickableIcons: false,
          fullscreenControl: true,
          gestureHandling: "cooperative",
          mapTypeControl: false,
          streetViewControl: false,
          zoom: initialCenterRef.current ? 14 : 13,
          zoomControl: true,
        });

        mapRef.current = map;
        infoWindowRef.current = new google.maps.InfoWindow();
        map.addListener("dragend", () => {
          const currentCenter = map.getCenter();

          if (!currentCenter) return;

          const nextCenter = {
            latitude: currentCenter.lat(),
            longitude: currentCenter.lng(),
          };

          setViewportCenter(nextCenter);
          onViewportCenterChangeRef.current?.(nextCenter);
        });
        setMapReady(true);
      } catch (mapError) {
        if (active) {
          setError(
            mapError instanceof GoogleMapsAuthError
              ? GOOGLE_MAPS_AUTH_ERROR_MESSAGE
              : mapError instanceof Error
              ? mapError.message
              : "Không thể tải bản đồ Google. Hãy kiểm tra browser key hoặc thử tải lại trang.",
          );
        }
      }
    }

    void initializeMap();

    return () => {
      active = false;
      markerStore.forEach((marker) => marker.setMap(null));
      markerStore.clear();
      centerMarkerRef.current?.setMap(null);
      centerMarkerRef.current = null;
      endpointMarkersRef.current.forEach((marker) => marker.setMap(null));
      endpointMarkersRef.current = [];
      routeRef.current?.setMap(null);
      routeRef.current = null;
      infoWindowRef.current?.close();
      infoWindowRef.current = null;
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!mapReady || !map) {
      return;
    }

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();
    centerMarkerRef.current?.setMap(null);
    centerMarkerRef.current = null;
    endpointMarkersRef.current.forEach((marker) => marker.setMap(null));
    endpointMarkersRef.current = [];
    routeRef.current?.setMap(null);
    routeRef.current = null;

    const bounds = new google.maps.LatLngBounds();

    if (showCenterMarker && center) {
      centerMarkerRef.current = new google.maps.Marker({
        icon: {
          fillColor: "#0284c7",
          fillOpacity: 1,
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
        map,
        position: { lat: center.latitude, lng: center.longitude },
        title: "Vị trí của bạn",
        zIndex: 1000,
      });
      bounds.extend({ lat: center.latitude, lng: center.longitude });
    }

    const originPosition = toLatLngLiteral(routeOrigin);
    const destinationPosition = toLatLngLiteral(routeDestination);

    if (mode === "route" && originPosition) {
      endpointMarkersRef.current.push(
        new google.maps.Marker({
          label: {
            color: "#ffffff",
            fontSize: "12px",
            fontWeight: "700",
            text: "A",
          },
          map,
          position: originPosition,
          title: routeOrigin?.text || "Điểm đầu",
          zIndex: 900,
        }),
      );
      bounds.extend(originPosition);
    }

    if (mode === "route" && destinationPosition) {
      endpointMarkersRef.current.push(
        new google.maps.Marker({
          label: {
            color: "#ffffff",
            fontSize: "12px",
            fontWeight: "700",
            text: "B",
          },
          map,
          position: destinationPosition,
          title: routeDestination?.text || "Điểm cuối",
          zIndex: 900,
        }),
      );
      bounds.extend(destinationPosition);
    }

    markerData.forEach((place, index) => {
      const position = { lat: place.latitude, lng: place.longitude };
      const marker = new google.maps.Marker({
        icon: getPlaceMarkerIcon("default"),
        label: {
          color: "#ffffff",
          fontSize: "12px",
          fontWeight: "700",
          text: String(index + 1),
        },
        map,
        position,
        title: place.name,
      });

      marker.addListener("click", () => {
        infoWindowRef.current?.setContent(buildInfoWindowContent(place));
        infoWindowRef.current?.open({ anchor: marker, map });
        onMarkerClickRef.current?.(place.placeId);
      });

      markersRef.current.set(place.placeId, marker);
      bounds.extend(position);
    });

    if (routePolyline) {
      const path = google.maps.geometry.encoding.decodePath(routePolyline);
      routeRef.current = new google.maps.Polyline({
        geodesic: true,
        map,
        path,
        strokeColor: "#006d8f",
        strokeOpacity: 0.9,
        strokeWeight: 5,
      });
      path.forEach((point) => bounds.extend(point));
    }

    if (center && mode !== "route") {
      bounds.extend({ lat: center.latitude, lng: center.longitude });
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, 44);

      if (markerData.length === 1 && !routePolyline) {
        google.maps.event.addListenerOnce(map, "idle", () => {
          if ((map.getZoom() ?? 0) > 16) {
            map.setZoom(16);
          }
        });
      }
    }
  }, [
    center,
    mapReady,
    markerData,
    mode,
    routeDestination,
    routeOrigin,
    routePolyline,
    showCenterMarker,
  ]);

  useEffect(() => {
    if (!mapReady) {
      return;
    }

    markersRef.current.forEach((marker, placeId) => {
      const variant =
        selectedPlaceId === placeId
          ? "selected"
          : hoveredPlaceId === placeId
            ? "hovered"
            : "default";

      marker.setIcon(getPlaceMarkerIcon(variant));
      marker.setZIndex(
        variant === "selected" ? 1200 : variant === "hovered" ? 1100 : 100,
      );
    });
  }, [hoveredPlaceId, mapReady, selectedPlaceId]);

  useEffect(() => {
    if (!mapReady || !selectedPlaceId) {
      return;
    }

    const map = mapRef.current;
    const marker = markersRef.current.get(selectedPlaceId);
    const position = marker?.getPosition();

    if (!map || !position) {
      return;
    }

    map.panTo(position);

    if ((map.getZoom() ?? 0) < 15) {
      map.setZoom(15);
    }
  }, [mapReady, selectedPlaceId]);

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <MapPinned aria-hidden="true" className="h-5 w-5 text-ocean" />
          <h2 className="text-base font-bold text-ink">
            {mode === "route" ? "Bản đồ tuyến và địa điểm" : "Bản đồ kết quả"}
          </h2>
        </div>
        <span className="text-sm font-semibold text-slate-500">
          {markerData.length} địa điểm có tọa độ
        </span>
      </div>

      <div className="relative min-h-[320px] w-full sm:min-h-[420px] lg:min-h-[620px]">
        <div className="absolute inset-0 bg-cloud" ref={containerRef} />
        {searchThisAreaVisible && viewportCenter && onSearchThisArea ? (
          <button
            className="absolute left-1/2 top-4 z-10 inline-flex min-h-10 -translate-x-1/2 items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-ocean disabled:cursor-not-allowed disabled:opacity-70"
            disabled={searchThisAreaLoading}
            onClick={() => onSearchThisArea(viewportCenter)}
            type="button"
          >
            <RotateCw
              aria-hidden="true"
              className={[
                "h-4 w-4",
                searchThisAreaLoading ? "animate-spin" : "",
              ].join(" ")}
            />
            {searchThisAreaLoading ? "Đang tìm..." : "Tìm lại khu vực này"}
          </button>
        ) : null}
        {!mapReady && !error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-cloud/95 px-4 text-center text-sm font-semibold text-slate-600">
            Đang tải bản đồ...
          </div>
        ) : null}
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-cloud px-5 text-center">
            <div className="max-w-lg">
              <AlertTriangle
                aria-hidden="true"
                className="mx-auto h-8 w-8 text-amber-600"
              />
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                {error}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
