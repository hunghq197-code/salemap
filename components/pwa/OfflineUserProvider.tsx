"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { readQueue } from "@/lib/offline/action-queue";
import { syncPendingOfflineActions } from "@/lib/offline/sync-actions";

type OfflineUserContextValue = {
  isSyncing: boolean;
  pendingCount: number;
  refreshQueue: () => void;
  syncNow: () => Promise<void>;
  userId: string;
};

const OfflineUserContext = createContext<OfflineUserContextValue | null>(null);

export function OfflineUserProvider({
  children,
  userId,
}: {
  children: ReactNode;
  userId: string;
}) {
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(() => readQueue(userId).length);
  const isSyncingRef = useRef(false);

  const refreshQueue = useCallback(() => {
    setPendingCount(readQueue(userId).length);
  }, [userId]);

  const syncNow = useCallback(async () => {
    if (!window.navigator.onLine || isSyncingRef.current) return;

    isSyncingRef.current = true;
    setIsSyncing(true);

    try {
      const result = await syncPendingOfflineActions(userId);
      refreshQueue();

      if (result.synced > 0) {
        router.refresh();
      }
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [refreshQueue, router, userId]);

  useEffect(() => {
    const onQueueUpdated = () => refreshQueue();
    const timer = window.setTimeout(onQueueUpdated, 0);

    window.addEventListener("salemap:offline-queue-updated", onQueueUpdated);
    window.addEventListener("salemap-offline-queue-updated", onQueueUpdated);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("salemap:offline-queue-updated", onQueueUpdated);
      window.removeEventListener("salemap-offline-queue-updated", onQueueUpdated);
    };
  }, [refreshQueue]);

  useEffect(() => {
    if (isOnline) {
      void syncNow();
    }
  }, [isOnline, syncNow]);

  const value = useMemo(
    () => ({
      isSyncing,
      pendingCount,
      refreshQueue,
      syncNow,
      userId,
    }),
    [isSyncing, pendingCount, refreshQueue, syncNow, userId],
  );

  return (
    <OfflineUserContext.Provider value={value}>
      {children}
    </OfflineUserContext.Provider>
  );
}

export function useOfflineUser() {
  const value = useContext(OfflineUserContext);

  if (!value) {
    throw new Error("useOfflineUser must be used inside OfflineUserProvider.");
  }

  return value;
}
