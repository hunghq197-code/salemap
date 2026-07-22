"use client";

import { trackEvent } from "@/lib/analytics/client";

type PerformanceEventName =
  | "api_request_duration"
  | "discovery_search_duration"
  | "map_loaded"
  | "route_change_complete"
  | "route_change_start"
  | "slow_route_detected";

type PerformanceProperties = {
  apiName?: string;
  durationMs?: number;
  isMobile?: boolean;
  resultCount?: number;
  route?: string;
  routeGroup?: string;
};

function sanitizePerformanceProperties(properties: PerformanceProperties) {
  return {
    apiName: properties.apiName,
    durationMs:
      typeof properties.durationMs === "number"
        ? Math.max(0, Math.round(properties.durationMs))
        : undefined,
    isMobile: properties.isMobile,
    resultCount:
      typeof properties.resultCount === "number"
        ? Math.max(0, Math.round(properties.resultCount))
        : undefined,
    route: properties.route,
    routeGroup: properties.routeGroup,
  };
}

export function getIsMobileViewport() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 767px)").matches
  );
}

export function trackPerformanceEvent(
  eventName: PerformanceEventName,
  properties: PerformanceProperties = {},
) {
  const safeProperties = sanitizePerformanceProperties(properties);

  if (process.env.NODE_ENV !== "production") {
    console.info(`[salemap:perf] ${eventName}`, safeProperties);
  }

  trackEvent(eventName, safeProperties);
}
