"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { AlertTriangle, MapPinned } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DiscoveryPlaceResult } from "@/lib/providers/maps/types";

type MapPreviewProps = {
  center?: { latitude: number; longitude: number } | null;
  mode?: "places" | "route";
  results: DiscoveryPlaceResult[];
  routePolyline?: string;
  showCenterMarker?: boolean;
};

type MarkerData = {
  address?: string;
  latitude: number;
  longitude: number;
  name: string;
  placeId: string;
};

let loaderConfigured = false;

function configureLoader(apiKey: string) {
  if (loaderConfigured) {
    return;
  }

  setOptions({
    authReferrerPolicy: "origin",
    key: apiKey,
    language: "vi",
    region: "VN",
    v: "weekly",
  });
  loaderConfigured = true;
}

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

export function MapPreview({
  center,
  mode = "places",
  results,
  routePolyline,
  showCenterMarker = false,
}: MapPreviewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY?.trim();
  const containerRef = useRef<HTMLDivElement>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const centerMarkerRef = useRef<google.maps.Marker | null>(null);
  const routeRef = useRef<google.maps.Polyline | null>(null);
  const [error, setError] = useState("");
  const [mapReady, setMapReady] = useState(false);

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
    let active = true;

    async function initializeMap() {
      if (!apiKey || !containerRef.current) {
        setError(
          "Chưa cấu hình browser key để hiển thị bản đồ. Danh sách địa điểm vẫn có thể sử dụng bình thường.",
        );
        return;
      }

      try {
        configureLoader(apiKey);
        await Promise.all([importLibrary("maps"), importLibrary("geometry")]);

        if (!active || !containerRef.current) {
          return;
        }

        mapRef.current = new google.maps.Map(containerRef.current, {
          backgroundColor: "#eef4f8",
          center: {
            lat: 10.7769,
            lng: 106.7009,
          },
          clickableIcons: false,
          fullscreenControl: true,
          gestureHandling: "cooperative",
          mapTypeControl: false,
          streetViewControl: false,
          zoom: 13,
          zoomControl: true,
        });
        infoWindowRef.current = new google.maps.InfoWindow();
        setMapReady(true);
      } catch {
        if (active) {
          setError(
            "Không thể tải bản đồ Google. Hãy kiểm tra quyền của browser key hoặc thử tải lại trang.",
          );
        }
      }
    }

    void initializeMap();

    return () => {
      active = false;
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      centerMarkerRef.current?.setMap(null);
      centerMarkerRef.current = null;
      routeRef.current?.setMap(null);
      routeRef.current = null;
      infoWindowRef.current?.close();
      infoWindowRef.current = null;
      mapRef.current = null;
    };
  }, [apiKey]);

  useEffect(() => {
    const map = mapRef.current;

    if (!mapReady || !map) {
      return;
    }

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    centerMarkerRef.current?.setMap(null);
    centerMarkerRef.current = null;
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
        title: "Vị trí hiện tại của bạn",
        zIndex: 1000,
      });
    }

    markerData.forEach((place, index) => {
      const position = { lat: place.latitude, lng: place.longitude };
      const marker = new google.maps.Marker({
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
      });

      markersRef.current.push(marker);
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
  }, [center, mapReady, markerData, mode, routePolyline, showCenterMarker]);

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

      <div className="relative min-h-[320px] w-full sm:min-h-[420px]">
        <div className="absolute inset-0 bg-cloud" ref={containerRef} />
        {!mapReady && !error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-cloud/95 px-4 text-center text-sm font-semibold text-slate-600">
            Đang tải bản đồ...
          </div>
        ) : null}
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-cloud px-5 text-center">
            <div className="max-w-lg">
              <AlertTriangle aria-hidden="true" className="mx-auto h-8 w-8 text-amber-600" />
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{error}</p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
