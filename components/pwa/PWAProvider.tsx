"use client";

import { Download, Wifi, WifiOff, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  trackPWAInstallAccepted,
  trackPWAInstallClicked,
  trackPWAInstallDismissed,
  trackPWAInstallPromptShown,
  trackPWAOfflineDetected,
  trackPWAOnlineRestored,
  trackPWAServiceWorkerReady,
} from "@/lib/analytics/client";
import { OFFLINE_QUEUE_STORAGE_KEY } from "@/components/pwa/useLocalFormDraft";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandaloneMode() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function isIOSDevice() {
  if (typeof window === "undefined") return false;

  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function getOfflineQueueCount() {
  if (typeof window === "undefined") return 0;

  try {
    const raw = window.localStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];

    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export function PWAProvider() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [queueCount, setQueueCount] = useState(0);
  const [showBackOnline, setShowBackOnline] = useState(false);
  const wasOffline = useRef(false);
  const installTracked = useRef(false);

  const standalone = useMemo(isStandaloneMode, []);
  const isIOS = useMemo(isIOSDevice, []);
  const shouldShowInstallHint =
    !standalone && !installDismissed && (Boolean(deferredPrompt) || isIOS);

  useEffect(() => {
    setIsOnline(window.navigator.onLine);
    setQueueCount(getOfflineQueueCount());

    const onOnline = () => {
      setIsOnline(true);
      setQueueCount(getOfflineQueueCount());

      if (wasOffline.current) {
        setShowBackOnline(true);
        trackPWAOnlineRestored({ queueCount: getOfflineQueueCount(), status: "online" });
        window.setTimeout(() => setShowBackOnline(false), 4500);
      }

      wasOffline.current = false;
    };
    const onOffline = () => {
      wasOffline.current = true;
      setIsOnline(false);
      trackPWAOfflineDetected({ queueCount: getOfflineQueueCount(), status: "offline" });
    };
    const onQueueUpdated = () => setQueueCount(getOfflineQueueCount());

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("salemap-offline-queue-updated", onQueueUpdated);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("salemap-offline-queue-updated", onQueueUpdated);
    };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        trackPWAServiceWorkerReady({
          mode: isStandaloneMode() ? "standalone" : "browser",
          status: registration.active ? "active" : "registered",
        });
      })
      .catch(() => {
        // PWA registration must not block the app.
      });
  }, []);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);

      if (!installTracked.current) {
        installTracked.current = true;
        trackPWAInstallPromptShown({ installSource: "browser_prompt" });
      }
    };
    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setInstallDismissed(true);
      trackPWAInstallAccepted({ installSource: "appinstalled" });
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    if (isIOS && !standalone && !installTracked.current) {
      installTracked.current = true;
      trackPWAInstallPromptShown({ installSource: "ios_instruction" });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [isIOS, standalone]);

  async function installApp() {
    trackPWAInstallClicked({
      installSource: deferredPrompt ? "browser_prompt" : "ios_instruction",
    });

    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      trackPWAInstallAccepted({ installSource: choice.platform || "browser_prompt" });
    } else {
      trackPWAInstallDismissed({ installSource: choice.platform || "browser_prompt" });
    }

    setDeferredPrompt(null);
    setInstallDismissed(true);
  }

  function dismissInstallHint() {
    setInstallDismissed(true);
    trackPWAInstallDismissed({
      installSource: deferredPrompt ? "browser_prompt" : "ios_instruction",
    });
  }

  return (
    <>
      {!isOnline || showBackOnline ? (
        <div className="pointer-events-none fixed left-3 right-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-[80] flex justify-center">
          <div
            className={[
              "pointer-events-auto inline-flex max-w-md items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold shadow-lg",
              isOnline
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-800",
            ].join(" ")}
            role="status"
          >
            {isOnline ? (
              <Wifi aria-hidden="true" className="h-4 w-4 shrink-0" />
            ) : (
              <WifiOff aria-hidden="true" className="h-4 w-4 shrink-0" />
            )}
            <span>
              {isOnline
                ? "Đã có mạng lại. Bạn có thể gửi các bản nháp đang giữ."
                : "Bạn đang offline. SaleMap sẽ dùng dữ liệu đã cache và giữ bản nháp form trên máy."}
              {!isOnline && queueCount > 0 ? ` (${queueCount} bản chờ gửi)` : ""}
            </span>
          </div>
        </div>
      ) : null}

      {shouldShowInstallHint ? (
        <div className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-3 right-3 z-[70] mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-3 shadow-xl lg:bottom-5 lg:left-auto lg:right-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink text-white">
              <Download aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-ink">Cài SaleMap trên điện thoại</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {deferredPrompt
                  ? "Mở nhanh như app, giữ shell gần đây khi mạng yếu."
                  : "Trên iPhone: bấm Chia sẻ, rồi chọn Thêm vào Màn hình chính."}
              </p>
              {deferredPrompt ? (
                <button
                  className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg bg-mint px-4 py-2 text-sm font-bold text-ink"
                  onClick={installApp}
                  type="button"
                >
                  Cài app
                </button>
              ) : null}
            </div>
            <button
              aria-label="Đóng hướng dẫn cài app"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500"
              onClick={dismissInstallHint}
              type="button"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
