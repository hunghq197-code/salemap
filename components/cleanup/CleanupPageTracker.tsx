"use client";

import { useEffect } from "react";
import { trackLeadCleanupViewed } from "@/lib/analytics/client";

export function CleanupPageTracker() {
  useEffect(() => {
    trackLeadCleanupViewed();
  }, []);

  return null;
}
