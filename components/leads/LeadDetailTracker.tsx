"use client";

import { useEffect } from "react";
import { trackLeadDetailViewed } from "@/lib/analytics/client";

type LeadDetailTrackerProps = {
  priority?: string | null;
  status?: string | null;
};

export function LeadDetailTracker({ priority, status }: LeadDetailTrackerProps) {
  useEffect(() => {
    trackLeadDetailViewed({ priority, status });
  }, [priority, status]);

  return null;
}
