"use client";

import { useState } from "react";
import { AreaSearchForm } from "@/components/discovery/AreaSearchForm";
import { LocationPermissionNotice } from "@/components/discovery/LocationPermissionNotice";
import { MapPreview } from "@/components/discovery/MapPreview";
import { NearMeSearchForm } from "@/components/discovery/NearMeSearchForm";
import { QuotaBar } from "@/components/discovery/QuotaBar";
import { RouteSearchForm } from "@/components/discovery/RouteSearchForm";
import { RouteSummaryCard } from "@/components/discovery/RouteSummaryCard";
import { SearchResultsList } from "@/components/discovery/SearchResultsList";
import { QuotaWarning } from "@/components/quota/QuotaWarning";
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

type SearchState = {
  center?: { latitude: number; longitude: number } | null;
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
    center?: { latitude: number; longitude: number };
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

type CurrentLocation = {
  accuracyMeters: number;
  latitude: number;
  longitude: number;
};

function getApiErrorMessage(payload: ApiError, source?: DiscoverySource) {
  if (payload.error?.message) {
    return payload.error.message;
  }

  return source === "route_search"
    ? "Không thể tìm dữ liệu tuyến đường lúc này. Vui lòng thử lại sau."
    : "Không thể tìm dữ liệu bản đồ lúc này. Vui lòng thử lại sau.";
}

function getCurrentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 30_000,
      timeout: 15_000,
    });
  });
}

function getGeolocationErrorMessage(error: unknown) {
  const code =
    error && typeof error === "object" && "code" in error
      ? Number((error as { code?: unknown }).code)
      : 0;

  if (!code) {
    return "Không lấy được vị trí hiện tại. Hãy thử lại hoặc dùng tìm theo khu vực.";
  }

  if (code === 1) {
    return "Bạn chưa cho phép SaleMap truy cập vị trí. Hãy bật quyền vị trí cho trang này rồi thử lại, hoặc dùng tab Theo khu vực.";
  }

  if (code === 2) {
    return "Thiết bị chưa xác định được vị trí. Hãy bật GPS/Wi-Fi rồi thử lại, hoặc dùng tab Theo khu vực.";
  }

  return "Việc lấy vị trí mất quá lâu. Hãy thử lại ở nơi có tín hiệu tốt hơn hoặc dùng tab Theo khu vực.";
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

export function DiscoverTabs({
  initialTab = "near-me",
  routeSearchEnabled = true,
}: DiscoverTabsProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    initialTab === "route" && !routeSearchEnabled ? "near-me" : initialTab,
  );
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation | null>(null);
  const [searchState, setSearchState] = useState<SearchState | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingPlaceId, setSavingPlaceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [quotaReached, setQuotaReached] = useState<QuotaReachedState | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function handleTabChange(tab: ActiveTab) {
    if (tab === "route" && !routeSearchEnabled) {
      setError("Tính năng tìm dọc tuyến hiện chưa được bật.");
      return;
    }

    setActiveTab(tab);
    setError(null);
    setNotice(null);
    setQuotaReached(null);
    setSuccessMessage(null);
    setSearchState(null);
  }

  async function submitSearch(
    endpoint: "/api/discovery/area" | "/api/discovery/near-me" | "/api/discovery/route",
    payload: Record<string, unknown>,
    source: DiscoverySource,
  ) {
    setLoading(true);
    setError(null);
    setNotice(null);
    setQuotaReached(null);
    setSuccessMessage(null);

    const events = getSearchEvents(source);
    trackMapEvent(events.started, {
      bufferMeters: Number(payload.bufferMeters || 0),
      keyword: String(payload.keyword || ""),
      radiusMeters: Number(payload.radiusMeters || 0),
      source,
    });

    try {
      const response = await fetch(endpoint, {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as SearchResponse;

      if (!response.ok || !result.success || !result.data) {
        if (result.error?.code === "QUOTA_EXCEEDED") {
          setQuotaReached(getReachedQuota(getQuotaActionForSource(source)));
        }

        throw new Error(getApiErrorMessage(result, source));
      }

      setSearchState({
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
      });

      trackMapEvent(events.completed, {
        bufferMeters: Number(payload.bufferMeters || 0),
        hasRouteDistance: Boolean(result.data.route?.distanceMeters),
        hasRouteDuration: Boolean(result.data.route?.durationSeconds),
        keyword: String(payload.keyword || ""),
        radiusMeters: Number(payload.radiusMeters || 0),
        remainingQuota: result.data.quota.remaining,
        resultCount: result.data.results.length,
        source,
      });

      const checklistKey = getChecklistKeyForSearch(source);
      if (checklistKey) trackBetaChecklistItemCompleted({ checklistKey });
    } catch (searchError) {
      setError(
        searchError instanceof Error
          ? searchError.message
          : getApiErrorMessage({}, source),
      );
      trackMapEvent(events.failed, {
        bufferMeters: Number(payload.bufferMeters || 0),
        keyword: String(payload.keyword || ""),
        radiusMeters: Number(payload.radiusMeters || 0),
        source,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleNearMeSearch(input: {
    keyword: string;
    radiusMeters: number;
  }) {
    if (!navigator.geolocation) {
      setNotice(
        "Trình duyệt này không hỗ trợ định vị. Bạn có thể dùng tab Theo khu vực để nhập địa điểm thủ công.",
      );
      return;
    }

    setLoading(true);
    setNotice(null);
    setError(null);
    setQuotaReached(null);

    try {
      const position = await getCurrentPosition();
      const location = {
        accuracyMeters: position.coords.accuracy,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setCurrentLocation(location);

      await submitSearch(
        "/api/discovery/near-me",
        {
          keyword: input.keyword,
          latitude: location.latitude,
          longitude: location.longitude,
          radiusMeters: input.radiusMeters,
        },
        "map_near_me",
      );
    } catch (locationError) {
      setLoading(false);
      setNotice(getGeolocationErrorMessage(locationError));
    }
  }

  async function handleAreaSearch(input: {
    areaText: string;
    keyword: string;
    radiusMeters: number;
  }) {
    await submitSearch("/api/discovery/area", input, "map_area");
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

  async function handleSavePlace(place: DiscoveryPlaceResult) {
    if (place.isSaved) return;

    setSavingPlaceId(place.placeId);
    setError(null);
    setQuotaReached(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/discovery/save-place", {
        body: JSON.stringify({
          address: place.address,
          category: place.category,
          googleMapsUrl: place.googleMapsUrl,
          latitude: place.latitude,
          longitude: place.longitude,
          name: place.name,
          phone: place.phone,
          placeId: place.placeId,
          rating: place.rating,
          rawPlaceData: place.raw,
          routeId: searchState?.route?.id,
          routeStopId: place.routeStopId,
          source: searchState?.source || "map_area",
          userRatingsTotal: place.userRatingsTotal,
          website: place.website,
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
        setSuccessMessage("Địa điểm này đã có trong lead cá nhân của bạn.");
        trackMapEvent(
          isRouteSearch
            ? ANALYTICS_EVENTS.ROUTE_PLACE_DUPLICATE_SAVED
            : ANALYTICS_EVENTS.MAP_PLACE_DUPLICATE_SAVED,
          {
            category: place.category,
            hasPhone: Boolean(place.phone),
            hasWebsite: Boolean(place.website),
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
            hasPhone: Boolean(place.phone),
            hasWebsite: Boolean(place.website),
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

  const isRouteResult = searchState?.source === "route_search";

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

      <div className="mt-5">
        {activeTab === "near-me" ? (
          <NearMeSearchForm
            loading={loading}
            locationAccuracyMeters={currentLocation?.accuracyMeters}
            onSubmit={handleNearMeSearch}
          />
        ) : activeTab === "area" ? (
          <AreaSearchForm loading={loading} onSubmit={handleAreaSearch} />
        ) : (
          <RouteSearchForm loading={loading} onSubmit={handleRouteSearch} />
        )}
      </div>

      <LocationPermissionNotice message={notice} />

      {error ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-700">
          {error}
        </div>
      ) : null}

      {quotaReached ? (
        <QuotaWarning
          actionType={quotaReached.actionType}
          className="mt-4"
          limit={quotaReached.limit}
          reached
          remaining={quotaReached.remaining}
          used={quotaReached.used}
        />
      ) : null}

      {successMessage ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {searchState ? (
        <div className="mt-6 space-y-5">
          {isRouteResult && searchState.route ? (
            <RouteSummaryCard
              count={searchState.results.length}
              quota={searchState.quota}
              route={searchState.route}
            />
          ) : (
            <QuotaBar count={searchState.results.length} quota={searchState.quota} />
          )}
          <MapPreview
            center={searchState.center}
            mode={isRouteResult ? "route" : "places"}
            results={searchState.results}
          />
          <SearchResultsList
            onSave={handleSavePlace}
            results={searchState.results}
            savingPlaceId={savingPlaceId}
            source={searchState.source}
          />
        </div>
      ) : null}
    </div>
  );
}
