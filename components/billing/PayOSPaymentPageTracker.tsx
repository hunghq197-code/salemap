"use client";

import { useEffect } from "react";
import {
  trackPayOSPaymentCancelled,
  trackPayOSPaymentReturnViewed,
} from "@/lib/analytics/client";

type PayOSPaymentPageTrackerProps = {
  amountVnd?: number;
  event: "cancel" | "return";
  planKey?: string;
  status?: string;
};

export function PayOSPaymentPageTracker({
  amountVnd,
  event,
  planKey,
  status,
}: PayOSPaymentPageTrackerProps) {
  useEffect(() => {
    const payload = {
      amountVnd,
      planKey,
      provider: "payos" as const,
      status,
    };

    if (event === "cancel") {
      trackPayOSPaymentCancelled(payload);
      return;
    }

    trackPayOSPaymentReturnViewed(payload);
  }, [amountVnd, event, planKey, status]);

  return null;
}
