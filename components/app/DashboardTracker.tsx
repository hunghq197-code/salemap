"use client";

import { useEffect } from "react";
import { trackAppDashboardViewed } from "@/lib/analytics/client";

export function DashboardTracker() {
  useEffect(() => {
    trackAppDashboardViewed();
  }, []);

  return null;
}
