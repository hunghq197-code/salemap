"use client";

import { useEffect } from "react";
import { trackPWAInstallGuideViewed } from "@/lib/analytics/client";

export function InstallGuideTracker() {
  useEffect(() => {
    trackPWAInstallGuideViewed({
      route: window.location.pathname,
      status: "viewed",
    });
  }, []);

  return null;
}
