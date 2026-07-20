"use client";

import { useEffect } from "react";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/client";

export function ThankYouTracker() {
  useEffect(() => {
    trackEvent(ANALYTICS_EVENTS.THANK_YOU_PAGE_VIEWED);
  }, []);

  return null;
}
