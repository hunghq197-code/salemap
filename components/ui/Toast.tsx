"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics/client";
import { isToastCode, TOAST_EVENT_MAP, TOAST_MESSAGES } from "@/lib/toast";

type ToastProps = {
  code?: string | null;
};

export function Toast({ code }: ToastProps) {
  const validCode = isToastCode(code) ? code : null;
  const [visible, setVisible] = useState(Boolean(validCode));
  const message = validCode ? TOAST_MESSAGES[validCode] : null;
  const isError =
    validCode === "error" ||
    validCode === "lead_invalid" ||
    validCode === "notification_settings_failed" ||
    validCode === "sample_data_failed";

  useEffect(() => {
    if (!validCode) {
      setVisible(false);
      return;
    }

    setVisible(true);

    const eventValue = TOAST_EVENT_MAP[validCode];
    const events = Array.isArray(eventValue)
      ? eventValue
      : eventValue
        ? [eventValue]
        : [];

    events.forEach((event) => {
      if (typeof event === "string") {
        trackEvent(event);
        return;
      }

      trackEvent(event.eventName, event.properties);
    });

    const timer = window.setTimeout(() => setVisible(false), 4200);
    return () => window.clearTimeout(timer);
  }, [validCode]);

  if (!message || !visible) {
    return null;
  }

  const Icon = isError ? XCircle : CheckCircle2;

  return (
    <div className="fixed inset-x-4 top-4 z-[80] mx-auto max-w-md sm:left-auto sm:right-5 sm:mx-0">
      <div
        className={[
          "flex items-start gap-3 rounded-lg border bg-white px-4 py-3 text-sm font-semibold shadow-soft",
          isError ? "border-rose-200 text-rose-700" : "border-emerald-200 text-ink",
        ].join(" ")}
        role="status"
      >
        <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 flex-none" />
        <p className="leading-6">{message}</p>
      </div>
    </div>
  );
}
