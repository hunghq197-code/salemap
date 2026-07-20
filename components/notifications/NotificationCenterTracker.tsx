"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

export function NotificationCenterTracker() {
  useEffect(() => {
    trackEvent(ANALYTICS_EVENTS.NOTIFICATION_CENTER_VIEWED);
  }, []);

  return null;
}
