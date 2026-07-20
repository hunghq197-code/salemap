"use client";

import { useEffect } from "react";
import { trackBetaStatusViewed } from "@/lib/analytics/client";

export function BetaStatusTracker() {
  useEffect(() => {
    trackBetaStatusViewed();
  }, []);

  return null;
}
