"use client";

import { useEffect } from "react";
import { trackPWAServiceWorkerReady } from "@/lib/analytics/client";

async function clearDevelopmentPwaCache() {
  const registrations = await navigator.serviceWorker.getRegistrations();

  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ("caches" in window) {
    const cacheNames = await window.caches.keys();
    await Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.startsWith("salemap-"))
        .map((cacheName) => window.caches.delete(cacheName)),
    );
  }
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV === "development") {
      void clearDevelopmentPwaCache();
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        window.dispatchEvent(new CustomEvent("salemap:pwa-sw-registered"));
        trackPWAServiceWorkerReady({
          mode: window.matchMedia("(display-mode: standalone)").matches
            ? "standalone"
            : "browser",
          status: registration.active ? "active" : "registered",
        });
      })
      .catch(() => {
        // Do not break the app if service worker registration fails.
      });
  }, []);

  return null;
}
