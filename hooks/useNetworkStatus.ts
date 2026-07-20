"use client";

import { useEffect, useState } from "react";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateOnline = () => {
      setIsOnline(true);
    };
    const updateOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    setIsOnline(window.navigator.onLine);

    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOffline);

    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOffline);
    };
  }, []);

  return {
    isOnline,
    wasOffline,
  };
}
