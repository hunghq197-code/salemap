"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    gtag?: (...args: [string, ...unknown[]]) => void;
  }
}

const campaignParamKeys = new Set([
  "gclid",
  "gbraid",
  "utm_campaign",
  "utm_content",
  "utm_medium",
  "utm_source",
  "utm_term",
  "wbraid",
]);

function getSafePagePath(pathname: string, searchParams: URLSearchParams) {
  const campaignParams = new URLSearchParams();

  searchParams.forEach((value, key) => {
    if (campaignParamKeys.has(key.toLowerCase())) {
      campaignParams.append(key, value.slice(0, 160));
    }
  });

  const campaignQuery = campaignParams.toString();

  return campaignQuery ? `${pathname}?${campaignQuery}` : pathname;
}

export function GoogleAnalyticsPageTracker() {
  const lastTrackedPathRef = useRef<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    const pagePath = getSafePagePath(pathname, new URLSearchParams(search));
    let retryId: number | undefined;
    let attempts = 0;

    const trackPageView = () => {
      if (lastTrackedPathRef.current === pagePath) {
        return;
      }

      if (typeof window.gtag !== "function") {
        if (attempts < 12) {
          attempts += 1;
          retryId = window.setTimeout(trackPageView, 250);
        }

        return;
      }

      window.gtag("event", "page_view", {
        page_location: `${window.location.origin}${pagePath}`,
        page_path: pagePath,
        page_title: document.title,
      });
      lastTrackedPathRef.current = pagePath;
    };

    trackPageView();

    return () => {
      if (retryId) {
        window.clearTimeout(retryId);
      }
    };
  }, [pathname, search]);

  return null;
}

export {};
