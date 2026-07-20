"use client";

import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  trackPWAOfflineDetected,
  trackPWAOnlineRestored,
} from "@/lib/analytics/client";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useOfflineUser } from "@/components/pwa/OfflineUserProvider";

export function NetworkStatusBanner() {
  const { isOnline } = useNetworkStatus();
  const { isSyncing, pendingCount, syncNow } = useOfflineUser();
  const [showBackOnline, setShowBackOnline] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      trackPWAOfflineDetected({ pendingCount, status: "offline" });
      return;
    }

    if (wasOffline.current) {
      setShowBackOnline(true);
      trackPWAOnlineRestored({ pendingCount, status: "online" });
      const timeout = window.setTimeout(() => setShowBackOnline(false), 4500);
      wasOffline.current = false;

      return () => window.clearTimeout(timeout);
    }
  }, [isOnline, pendingCount]);

  if (isOnline && !showBackOnline && pendingCount === 0) return null;

  return (
    <div className="sticky top-0 z-30 -mx-4 mb-4 px-4 sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:px-0">
      <div
        className={[
          "flex flex-col gap-3 rounded-lg border px-4 py-3 text-sm font-semibold leading-6 shadow-sm sm:flex-row sm:items-center sm:justify-between",
          isOnline
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-amber-200 bg-amber-50 text-amber-800",
        ].join(" ")}
        role="status"
      >
        <span className="inline-flex items-start gap-2">
          {isOnline ? (
            <Wifi aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <WifiOff aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>
            {isOnline
              ? "Đã có mạng trở lại. Đang đồng bộ dữ liệu nháp nếu có."
              : "Bạn đang offline. Một số dữ liệu có thể chưa được cập nhật."}
            {pendingCount > 0 ? ` (${pendingCount} mục chờ đồng bộ)` : ""}
          </span>
        </span>
        {isOnline && pendingCount > 0 ? (
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-ink"
            disabled={isSyncing}
            onClick={() => void syncNow()}
            type="button"
          >
            <RefreshCw
              aria-hidden="true"
              className={["h-4 w-4", isSyncing ? "animate-spin" : ""].join(" ")}
            />
            Đồng bộ ngay
          </button>
        ) : null}
      </div>
    </div>
  );
}
