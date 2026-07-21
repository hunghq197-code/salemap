"use client";

import { useSyncExternalStore } from "react";

let hasBeenOffline = false;

function subscribeNetwork(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const updateOnline = () => {
    callback();
  };
  const updateOffline = () => {
    hasBeenOffline = true;
    callback();
  };

  window.addEventListener("online", updateOnline);
  window.addEventListener("offline", updateOffline);

  return () => {
    window.removeEventListener("online", updateOnline);
    window.removeEventListener("offline", updateOffline);
  };
}

function getOnlineSnapshot() {
  return typeof window === "undefined" ? true : window.navigator.onLine;
}

function getWasOfflineSnapshot() {
  if (typeof window !== "undefined" && !window.navigator.onLine) {
    return true;
  }

  return hasBeenOffline;
}

export function useNetworkStatus() {
  const isOnline = useSyncExternalStore(subscribeNetwork, getOnlineSnapshot, () => true);
  const wasOffline = useSyncExternalStore(subscribeNetwork, getWasOfflineSnapshot, () => false);

  return {
    isOnline,
    wasOffline,
  };
}
