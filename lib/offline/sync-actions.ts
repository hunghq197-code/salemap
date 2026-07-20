"use client";

import {
  getPendingOfflineActions,
  removeOfflineAction,
  updateOfflineAction,
} from "@/lib/offline/action-queue";
import {
  trackOfflineActionSyncFailed,
  trackOfflineActionSynced,
} from "@/lib/analytics/client";

export async function syncPendingOfflineActions(userId: string) {
  const actions = getPendingOfflineActions(userId);
  let synced = 0;

  for (const action of actions) {
    try {
      updateOfflineAction(userId, action.id, {
        error: undefined,
        retryCount: action.retryCount + 1,
        status: "syncing",
      });

      const response = await fetch(
        action.type === "create_lead_note" ? "/api/leads/notes" : "/api/reminders",
        {
          body: JSON.stringify(action.payload),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error("SYNC_FAILED");
      }

      removeOfflineAction(userId, action.id);
      synced += 1;
      trackOfflineActionSynced({
        actionType: action.type,
        pendingCount: Math.max(actions.length - synced, 0),
        status: "synced",
      });
    } catch {
      updateOfflineAction(userId, action.id, {
        error: "Không thể đồng bộ. Vui lòng thử lại.",
        status: "failed",
      });
      trackOfflineActionSyncFailed({
        actionType: action.type,
        pendingCount: actions.length - synced,
        status: "failed",
      });
    }
  }

  return {
    attempted: actions.length,
    synced,
  };
}
