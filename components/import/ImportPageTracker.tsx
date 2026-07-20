"use client";

import { useEffect } from "react";
import { trackImportPageViewed } from "@/lib/analytics/client";

export function ImportPageTracker() {
  useEffect(() => {
    trackImportPageViewed();
  }, []);

  return null;
}
