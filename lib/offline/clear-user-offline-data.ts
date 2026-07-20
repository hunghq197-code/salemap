"use client";

import { clearUserOfflineQueue } from "@/lib/offline/action-queue";
import { clearUserDrafts } from "@/lib/offline/drafts";
import { clearUserLocalCache } from "@/lib/offline/local-cache";

export function clearUserOfflineData(userId: string) {
  clearUserLocalCache(userId);
  clearUserDrafts(userId);
  clearUserOfflineQueue(userId);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.controller?.postMessage({
      type: "SALEMAP_CLEAR_RUNTIME_CACHE",
    });
  }
}
