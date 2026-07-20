"use client";

import { useEffect } from "react";
import {
  trackAdminDashboardViewed,
  trackAdminFeedbackViewed,
  trackEvent,
  trackAdminUpgradeInterestsViewed,
  trackAdminUsersViewed,
} from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

type AdminPageTrackerProps = {
  filterApplied?: boolean;
  page: "dashboard" | "feedback" | "retention" | "surveys" | "upgrade_interests" | "users";
};

export function AdminPageTracker({ filterApplied, page }: AdminPageTrackerProps) {
  useEffect(() => {
    if (page === "dashboard") {
      trackAdminDashboardViewed();
    }

    if (page === "users") {
      trackAdminUsersViewed({ filterApplied });
    }

    if (page === "feedback") {
      trackAdminFeedbackViewed({ filterApplied });
    }

    if (page === "upgrade_interests") {
      trackAdminUpgradeInterestsViewed({ filterApplied });
    }

    if (page === "retention") {
      trackEvent(ANALYTICS_EVENTS.ADMIN_RETENTION_VIEWED, { filterApplied });
    }

    if (page === "surveys") {
      trackEvent("admin_surveys_viewed");
    }
  }, [filterApplied, page]);

  return null;
}
