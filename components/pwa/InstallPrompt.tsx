"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import {
  trackPWAInstallAccepted,
  trackPWAInstallClicked,
  trackPWAInstallDismissed,
  trackPWAInstallPromptShown,
} from "@/lib/analytics/client";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;

    const dismissed = window.localStorage.getItem("salemap:pwa-install-dismissed");
    if (dismissed === "1") return;

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
      trackPWAInstallPromptShown({
        installSource: "browser_prompt",
        isStandalone: false,
      });
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  if (!visible || !deferredPrompt) return null;

  async function installApp() {
    if (!deferredPrompt) return;

    trackPWAInstallClicked({ installSource: "browser_prompt" });
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      trackPWAInstallAccepted({ installSource: choice.platform || "browser_prompt" });
    } else {
      trackPWAInstallDismissed({ installSource: choice.platform || "browser_prompt" });
    }

    setVisible(false);
    setDeferredPrompt(null);
  }

  function dismiss() {
    window.localStorage.setItem("salemap:pwa-install-dismissed", "1");
    setVisible(false);
    trackPWAInstallDismissed({ installSource: "browser_prompt" });
  }

  return (
    <div className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-4 right-4 z-50 rounded-lg border border-slate-200 bg-white p-4 shadow-xl md:left-auto md:right-6 md:w-96 lg:bottom-6">
      <div className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink text-white">
          <Download aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-bold text-ink">Cài SaleMap như app</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Cài SaleMap lên màn hình chính để mở nhanh khi đi thị trường.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-mint px-4 py-2 text-sm font-bold text-ink"
              onClick={installApp}
              type="button"
            >
              Cài app
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink"
              onClick={dismiss}
              type="button"
            >
              Để sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
