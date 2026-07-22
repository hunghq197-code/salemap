"use client";

import { useEffect, useRef, useState } from "react";
import { AreaSearchForm } from "@/components/discovery/AreaSearchForm";
import { LocationPermissionNotice } from "@/components/discovery/LocationPermissionNotice";
import { MapPreview } from "@/components/discovery/MapPreview";
import { NearMeSearchForm } from "@/components/discovery/NearMeSearchForm";
import { QuotaBar } from "@/components/discovery/QuotaBar";
import { RouteSearchForm } from "@/components/discovery/RouteSearchForm";
import { RouteSummaryCard } from "@/components/discovery/RouteSummaryCard";
import { SearchResultsList } from "@/components/discovery/SearchResultsList";
import { QuotaWarning } from "@/components/quota/QuotaWarning";
import { useDeviceLocation } from "@/hooks/useDeviceLocation";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import {
  trackBetaChecklistItemCompleted,
  trackMapEvent,
} from "@/lib/analytics/client";
import { DAILY_QUOTAS, type DailyQuotaAction } from "@/lib/constants/quota";
import type {
  DiscoveryPlaceResult,
  DiscoveryQuota,
  DiscoveryRouteResult,
  DiscoverySource,
} from "@/lib/providers/maps/types";

type ActiveTab = "area" | "near-me" | "route";
type MobileView = "list" | "map";

type MapPoint = {
  latitude: number;
  longitude: number;
};

type SearchState = {
  center?: MapPoint | null;
  quota?: DiscoveryQuota | null;
  results: DiscoveryPlaceResult[];
  route?: DiscoveryRouteResult;
  source: DiscoverySource;
};

type ApiError = {
  error?: {
    code?: string;
    message?: string;
  };
  success?: boolean;
};

type SearchResponse = ApiError & {
  data?: {
    center?: MapPoint;
    quota: DiscoveryQuota;
    results: DiscoveryPlaceResult[];
    route?: DiscoveryRouteResult;
  };
};

type SaveResponse = ApiError & {
  data?: {
    alreadySaved: boolean;
    leadId: string;
  };
};

type PlaceDetailsResponse = ApiError & {
  data?: Pick<
    DiscoveryPlaceResult,
    | "detailsLoaded"
    | "googleMapsUrl"
    | "phone"
    | "rating"
    | "userRatingsTotal"
    | "website"
  >;
};

type DiscoverTabsProps = {
  initialTab?: ActiveTab;
  routeSearchEnabled?: boolean;
};

type QuotaReachedState = {
  actionType: DailyQuotaAction;
  limit: number;
  remaining: number;
  used: number;
};

type AreaSearchMemory = {
  areaText?: string;
  keyword: string;
  radiusMeters: number;
};

function getApiErrorMessage(payload: ApiError, source?: DiscoverySource) {
  if (payload.error?.message) {
    return payload.error.message;
  }

  return source === "route_search"
    ? "Không thể tìm dữ liệu tuyến đường lúc này. Vui lòng thử lại sau."
    : "Không thể tìm dữ liệu bản đồ lúc này. Vui lòng thử lại sau.";
}

function getSearchEvents(source: DiscoverySource) {
  if (source === "route_search") {
    return {
      completed: ANALYTICS_EVENTS.ROUTE_SEARCH_COMPLETED,
      failed: ANALYTICS_EVENTS.ROUTE_SEARCH_FAILED,
      started: ANALYTICS_EVENTS.ROUTE_SEARCH_STARTED,
    };
  }

  if (source === "map_near_me") {
    return {
      completed: ANALYTICS_EVENTS.MAP_NEAR_ME_SEARCH_COMPLETED,
      failed: ANALYTICS_EVENTS.MAP_SEARCH_FAILED,
      started: ANALYTICS_EVENTS.MAP_NEAR_ME_SEARCH_STARTED,
    };
  }

  return {
    completed: ANALYTICS_EVENTS.MAP_AREA_SEARCH_COMPLETED,
    failed: ANALYTICS_EVENTS.MAP_SEARCH_FAILED,
    started: ANALYTICS_EVENTS.MAP_AREA_SEARCH_STARTED,
  };
}

function getChecklistKeyForSearch(source: DiscoverySource) {
  if (source === "map_area") return "search_area";
  if (source === "route_search") return "search_route";
  return null;
}

function getQuotaActionForSource(source: DiscoverySource): DailyQuotaAction {
  if (source === "route_search") return "route_search";
  if (source === "map_near_me") return "near_me_search";
  return "area_search";
}

function getReachedQuota(actionType: DailyQuotaAction): QuotaReachedState {
  const limit = DAILY_QUOTAS[actionType];

  return {
    actionType,
    limit,
    remaining: 0,
    used: limit,
  };
}

function getRadiusBucket(value?: unknown) {
  const meters = Number(value || 0);

  if (!meters) return "none";
  return meters >= 1000 ? `${meters / 1000}km` : `${meters}m`;
}

function getSafeSearchProperties(
  payload: Record<string, unknown>,
  source: DiscoverySource,
) {
  const radiusValue =
    source === "route_search" ? payload.bufferMeters : payload.radiusMeters;

  return {
    keywordLength: String(payload.keyword || "").length,
    radiusBucket: getRadiusBucket(radiusValue),
    searchType: source,
    source,
  };
}

function scrollPlaceCardIntoView(placeId: string) {
  requestAnimationFrame(() => {
    const cards = Array.from(
      document.querySelectorAll<HTMLElement>("[data-discovery-place-card]"),
    );
    const card = cards.find((item) => item.dataset.placeId === placeId);

    card?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
}

export function DiscoverTabs({
  initialTab = "near-me",
  routeSearchEnabled = true,
}: DiscoverTabsProps) {
  const deviceLocation = useDeviceLocation();
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    initialTab === "route" && !routeSearchEnabled ? "near-me" : initialTab,
  );
  const [areaMapMoved, setAreaMapMoved] = useState(false);
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null);
  const [lastAreaSearch, setLastAreaSearch] = useState<AreaSearchMemory | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [loadingDetailsPlaceId, setLoadingDetailsPlaceId] = useState<
    string | null
  >(null);
  const [mobileView, setMobileView] = useState<MobileView>("list");
  const [notice, setNotice] = useState<string | null>(null);
  const [quotaReached, setQuotaReached] = useState<QuotaReachedState | null>(
    null,
  );
  const [savingPlaceId, setSavingPlaceId] = useState<string | null>(null);
  const [searchState, setSearchState] = useState<SearchState | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchControllerRef = useRef<AbortController | null>(null);
  const viewportCenterRef = useRef<MapPoint | null>(null);
  const locationTrackedRef = useRef(false);

  const hasLocation =
    deviceLocation.latitude != null && deviceLocation.longitude != null;
  const locationCenter = hasLocation
    ? {
        latitude: deviceLocation.latitude as number,
        longitude: deviceLocation.longitude as number,
      }
    : null;
  const isRouteResult = searchState?.source === "route_search";
  const mapCenter = searchState?.center ?? locationCenter;
  const showSearchThisArea =
    activeTab === "area" &&
    searchState?.source === "map_area" &&
    areaMapMoved &&
    Boolean(lastAreaSearch);

  useEffect(
    () => () => {
      searchControllerRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    if (!hasLocation || locationTrackedRef.current) {
      return;
    }

    locationTrackedRef.current = true;
    trackMapEvent(ANALYTICS_EVENTS.DEVICE_LOCATION_SUCCESS, {
      source: "map_near_me",
    });
  }, [hasLocation]);

  useEffect(() => {
    if (!deviceLocation.error) {
      return;
    }

    trackMapEvent(ANALYTICS_EVENTS.DEVICE_LOCATION_FAILED, {
      errorCode: deviceLocation.permissionState,
      source: "map_near_me",
    });
  }, [deviceLocation.error, deviceLocation.permissionState]);

  function resetTransientState() {
    setError(null);
    setNotice(null);
    setQuotaReached(null);
    setSuccessMessage(null);
  }

  function handleTabChange(tab: ActiveTab) {
    if (tab === "route" && !routeSearchEnabled) {
      setError("Tính năng tìm dọc tuyến hiện chưa được bật.");
      return;
    }

    searchControllerRef.current?.abort();
    searchControllerRef.current = null;
    setActiveTab(tab);
    setAreaMapMoved(false);
    setHoveredPlaceId(null);
    setLoading(false);
    setMobileView("list");
    setSearchState(null);
    setSelectedPlaceId(null);
    resetTransientState();
  }

  async function submitSearch(
    endpoint:
      | "/api/discovery/area"
      | "/api/discovery/near-me"
      | "/api/discovery/route",
    payload: Record<string, unknown>,
    source: DiscoverySource,
  ) {
    searchControllerRef.current?.abort();
    const controller = new AbortController();
    searchControllerRef.current = controller;
    setAreaMapMoved(false);
    setHoveredPlaceId(null);
    setLoading(true);
    setSelectedPlaceId(null);
    resetTransientState();

    const events = getSearchEvents(source);
    trackMapEvent(events.started, getSafeSearchProperties(payload, source));

    try {
      const response = await fetch(endpoint, {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "POST",
        signal: controller.signal,
      });
      const result = (await response.json()) as SearchResponse;

      if (!response.ok || !result.success || !result.data) {
        if (result.error?.code === "QUOTA_EXCEEDED") {
          setQuotaReached(getReachedQuota(getQuotaActionForSource(source)));
        }

        throw new Error(getApiErrorMessage(result, source));
      }

      const nextState = {
        center:
          result.data.center ||
          (source === "map_near_me"
            ? {
                latitude: Number(payload.latitude),
                longitude: Number(payload.longitude),
              }
            : null),
        quota: result.data.quota,
        results: result.data.results,
        route: result.data.route,
        source,
      };

      setSearchState(nextState);
      setMobileView("map");

      trackMapEvent(events.completed, {
        ...getSafeSearchProperties(payload, source),
        hasResults: result.data.results.length > 0,
        hasRouteDistance: Boolean(result.data.route?.distanceMeters),
        hasRouteDuration: Boolean(result.data.route?.durationSeconds),
        remainingQuota: result.data.quota.remaining,
        resultCount: result.data.results.length,
      });

      const checklistKey = getChecklistKeyForSearch(source);
      if (checklistKey) trackBetaChecklistItemCompleted({ checklistKey });
    } catch (searchError) {
      if (searchError instanceof DOMException && searchError.name === "AbortError") {
        return;
      }

      setError(
        searchError instanceof Error
          ? searchError.message
          : getApiErrorMessage({}, source),
      );
      trackMapEvent(events.failed, {
        ...getSafeSearchProperties(payload, source),
        errorCode:
          searchError instanceof Error ? searchError.message.slice(0, 80) : "UNKNOWN",
      });
    } finally {
      if (searchControllerRef.current === controller) {
        searchControllerRef.current = null;
        setLoading(false);
      }
    }
  }

  async function loadPlaceDetails(
    place: DiscoveryPlaceResult,
    reportError = true,
  ): Promise<DiscoveryPlaceResult> {
    if (place.detailsLoaded) {
      return place;
    }

    setLoadingDetailsPlaceId(place.placeId);

    try {
      const response = await fetch("/api/discovery/place-details", {
        body: JSON.stringify({ placeId: place.placeId }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as PlaceDetailsResponse;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(getApiErrorMessage(result, searchState?.source));
      }

      const enrichedPlace = {
        ...place,
        ...result.data,
        detailsLoaded: true,
      };

      setSearchState((current) =>
        current
          ? {
              ...current,
              results: current.results.map((item) =>
                item.placeId === place.placeId ? enrichedPlace : item,
              ),
            }
          : current,
      );

      return enrichedPlace;
    } catch (detailsError) {
      if (reportError) {
        setError(
          detailsError instanceof Error
            ? detailsError.message
            : "Không thể tải thông tin liên hệ. Vui lòng thử lại.",
        );
      }
      throw detailsError;
    } finally {
      setLoadingDetailsPlaceId(null);
    }
  }

  function handleRequestLocation() {
    trackMapEvent(ANALYTICS_EVENTS.DEVICE_LOCATION_REQUESTED, {
      source: "map_near_me",
    });
    void deviceLocation.requestLocation();
  }

  async function handleNearMeSearch(input: {
    keyword: string;
    radiusMeters: number;
  }) {
    if (!locationCenter) {
      setNotice("Bấm dùng vị trí hiện tại để bắt đầu.");
      return;
    }

    await submitSearch(
      "/api/discovery/near-me",
      {
        keyword: input.keyword,
        latitude: locationCenter.latitude,
        longitude: locationCenter.longitude,
        radiusMeters: input.radiusMeters,
      },
      "map_near_me",
    );
  }

  async function handleAreaSearch(input: {
    areaText: string;
    keyword: string;
    radiusMeters: number;
  }) {
    setLastAreaSearch(input);
    await submitSearch("/api/discovery/area", input, "map_area");
  }

  async function handleSearchThisArea(center: MapPoint) {
    if (!lastAreaSearch) {
      return;
    }

    await submitSearch(
      "/api/discovery/area",
      {
        center,
        keyword: lastAreaSearch.keyword,
        radiusMeters: lastAreaSearch.radiusMeters,
      },
      "map_area",
    );
    trackMapEvent(ANALYTICS_EVENTS.MAP_SEARCH_THIS_AREA_CLICKED, {
      keywordLength: lastAreaSearch.keyword.length,
      radiusBucket: getRadiusBucket(lastAreaSearch.radiusMeters),
      searchType: "map_area",
      source: "map_area",
    });
  }

  async function handleRouteSearch(input: {
    bufferMeters: number;
    destinationText: string;
    keyword: string;
    originText: string;
  }) {
    if (!routeSearchEnabled) {
      setError("Tính năng tìm dọc tuyến hiện chưa được bật.");
      return;
    }

    await submitSearch("/api/discovery/route", input, "route_search");
  }

  function handleViewportCenterChange(center: MapPoint) {
    viewportCenterRef.current = center;

    if (activeTab === "area" && searchState?.source === "map_area") {
      setAreaMapMoved(true);
    }
  }

  function handleSelectPlace(placeId: string, source: "card" | "marker") {
    setSelectedPlaceId(placeId);
    scrollPlaceCardIntoView(placeId);
    trackMapEvent(
      source === "marker"
        ? ANALYTICS_EVENTS.MAP_MARKER_CLICKED
        : ANALYTICS_EVENTS.PLACE_CARD_CLICKED,
      {
        source: searchState?.source,
      },
    );
  }

  async function handleSavePlace(place: DiscoveryPlaceResult) {
    if (place.isSaved) return;

    setSavingPlaceId(place.placeId);
    setError(null);
    setQuotaReached(null);
    setSuccessMessage(null);

    try {
      let placeToSave = place;

      if (!place.detailsLoaded) {
        try {
          placeToSave = await loadPlaceDetails(place, false);
        } catch {
          // Core search fields are enough to create the lead.
        }
      }

      const response = await fetch("/api/discovery/save-place", {
        body: JSON.stringify({
          address: placeToSave.address,
          category: placeToSave.category,
          googleMapsUrl: placeToSave.googleMapsUrl,
          latitude: placeToSave.latitude,
          longitude: placeToSave.longitude,
          name: placeToSave.name,
          phone: placeToSave.phone,
          placeId: placeToSave.placeId,
          rating: placeToSave.rating,
          rawPlaceData: placeToSave.raw,
          routeId: searchState?.route?.id,
          routeStopId: place.routeStopId,
          source: searchState?.source || "map_area",
          userRatingsTotal: placeToSave.userRatingsTotal,
          website: placeToSave.website,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as SaveResponse;

      if (!response.ok || !result.success || !result.data) {
        if (result.error?.code === "QUOTA_EXCEEDED") {
          setQuotaReached(getReachedQuota("save_map_lead"));
        }
        throw new Error(getApiErrorMessage(result, searchState?.source));
      }

      setSearchState((current) =>
        current
          ? {
              ...current,
              results: current.results.map((item) =>
                item.placeId === place.placeId
                  ? {
                      ...item,
                      isSaved: true,
                      savedLeadId: result.data?.leadId,
                    }
                  : item,
              ),
            }
          : current,
      );

      const isRouteSearch = searchState?.source === "route_search";
      if (result.data.alreadySaved) {
        setSuccessMessage("Địa điểm này đã có trong danh sách lead của bạn.");
        trackMapEvent(
          isRouteSearch
            ? ANALYTICS_EVENTS.ROUTE_PLACE_DUPLICATE_SAVED
            : ANALYTICS_EVENTS.MAP_PLACE_DUPLICATE_SAVED,
          {
            category: place.category,
            hasPhone: Boolean(placeToSave.phone),
            hasWebsite: Boolean(placeToSave.website),
            source: searchState?.source,
          },
        );
      } else {
        setSuccessMessage("Đã lưu vào lead cá nhân.");
        trackMapEvent(
          isRouteSearch
            ? ANALYTICS_EVENTS.ROUTE_PLACE_SAVED_AS_LEAD
            : ANALYTICS_EVENTS.MAP_PLACE_SAVED_AS_LEAD,
          {
            category: place.category,
            hasPhone: Boolean(placeToSave.phone),
            hasWebsite: Boolean(placeToSave.website),
            source: searchState?.source,
          },
        );
        trackBetaChecklistItemCompleted({ checklistKey: "create_first_lead" });
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Không thể lưu địa điểm này. Vui lòng thử lại.",
      );
    } finally {
      setSavingPlaceId(null);
    }
  }

  const form =
    activeTab === "near-me" ? (
      <NearMeSearchForm
        hasLocation={hasLocation}
        loading={loading}
        locationAccuracyMeters={deviceLocation.accuracy}
        locationError={deviceLocation.error}
        locationLoading={deviceLocation.loading}
        onRequestLocation={handleRequestLocation}
        onSubmit={handleNearMeSearch}
      />
    ) : activeTab === "area" ? (
      <AreaSearchForm loading={loading} onSubmit={handleAreaSearch} />
    ) : (
      <RouteSearchForm loading={loading} onSubmit={handleRouteSearch} />
    );

  const map = (
    <MapPreview
      center={mapCenter}
      hoveredPlaceId={hoveredPlaceId}
      mode={isRouteResult ? "route" : "places"}
      onMarkerClick={(placeId) => handleSelectPlace(placeId, "marker")}
      onSearchThisArea={handleSearchThisArea}
      onViewportCenterChange={handleViewportCenterChange}
      results={searchState?.results ?? []}
      routeDestination={searchState?.route?.destination}
      routeOrigin={searchState?.route?.origin}
      routePolyline={searchState?.route?.polyline}
      searchThisAreaLoading={loading}
      searchThisAreaVisible={showSearchThisArea}
      selectedPlaceId={selectedPlaceId}
      showCenterMarker={searchState?.source === "map_near_me" || (!searchState && hasLocation)}
    />
  );

  return (
    <div className="mt-6">
      <div className="grid grid-cols-3 gap-2 rounded-lg bg-white p-1 shadow-sm ring-1 ring-slate-200">
        {[
          { label: "Quanh tôi", value: "near-me" },
          { label: "Theo khu vực", value: "area" },
          { disabled: !routeSearchEnabled, label: "Dọc tuyến", value: "route" },
        ].map((tab) => {
          const isActive = activeTab === tab.value;

          return (
            <button
              className={[
                "min-h-11 rounded-lg px-2 py-2 text-sm font-bold transition",
                tab.disabled
                  ? "cursor-not-allowed text-slate-400"
                  : isActive
                    ? "bg-ink text-white"
                    : "text-slate-600 hover:bg-cloud hover:text-ink",
              ].join(" ")}
              disabled={tab.disabled}
              key={tab.value}
              onClick={() => handleTabChange(tab.value as ActiveTab)}
              type="button"
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {searchState ? (
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-white p-1 shadow-sm ring-1 ring-slate-200 lg:hidden">
          <button
            className={[
              "min-h-10 rounded-lg text-sm font-bold",
              mobileView === "list" ? "bg-ink text-white" : "text-slate-600",
            ].join(" ")}
            onClick={() => setMobileView("list")}
            type="button"
          >
            Danh sách
          </button>
          <button
            className={[
              "min-h-10 rounded-lg text-sm font-bold",
              mobileView === "map" ? "bg-ink text-white" : "text-slate-600",
            ].join(" ")}
            onClick={() => setMobileView("map")}
            type="button"
          >
            Bản đồ
          </button>
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
        <section
          className={[
            "space-y-5",
            searchState && mobileView === "map" ? "hidden lg:block" : "",
          ].join(" ")}
        >
          {form}

          <LocationPermissionNotice message={notice} />

          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-700">
              {error}
            </div>
          ) : null}

          {quotaReached ? (
            <QuotaWarning
              actionType={quotaReached.actionType}
              limit={quotaReached.limit}
              reached
              remaining={quotaReached.remaining}
              used={quotaReached.used}
            />
          ) : null}

          {successMessage ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          {searchState ? (
            <>
              {isRouteResult && searchState.route ? (
                <RouteSummaryCard
                  count={searchState.results.length}
                  quota={searchState.quota}
                  route={searchState.route}
                />
              ) : (
                <QuotaBar
                  count={searchState.results.length}
                  quota={searchState.quota}
                />
              )}

              <SearchResultsList
                hoveredPlaceId={hoveredPlaceId}
                loadingDetailsPlaceId={loadingDetailsPlaceId}
                onHoverPlace={setHoveredPlaceId}
                onLoadDetails={(place) => void loadPlaceDetails(place)}
                onSave={handleSavePlace}
                onSelectPlace={(placeId) => handleSelectPlace(placeId, "card")}
                results={searchState.results}
                savingPlaceId={savingPlaceId}
                selectedPlaceId={selectedPlaceId}
                source={searchState.source}
              />
            </>
          ) : null}
        </section>

        <section
          className={[
            "lg:sticky lg:top-24",
            searchState && mobileView === "list" ? "hidden lg:block" : "",
          ].join(" ")}
        >
          {map}
        </section>
      </div>
    </div>
  );
}
