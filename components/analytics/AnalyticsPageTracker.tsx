"use client";

import { useEffect } from "react";
import { trackSalesAnalyticsViewed } from "@/lib/analytics/client";

type AnalyticsPageTrackerProps = {
  activeGoalsCount?: number;
  hasGoals?: boolean;
  period?: string;
};

export function AnalyticsPageTracker({
  activeGoalsCount,
  hasGoals,
  period,
}: AnalyticsPageTrackerProps) {
  useEffect(() => {
    trackSalesAnalyticsViewed({
      activeGoalsCount,
      hasGoals,
      period,
    });
  }, [activeGoalsCount, hasGoals, period]);

  return null;
}
