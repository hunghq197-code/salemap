"use client";

import { useEffect } from "react";
import { trackBetaGuideViewed } from "@/lib/analytics/client";

export function BetaGuideTracker() {
  useEffect(() => {
    trackBetaGuideViewed();
  }, []);

  return null;
}
