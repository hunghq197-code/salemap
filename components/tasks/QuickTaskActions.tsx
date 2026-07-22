"use client";

import { Copy, Phone } from "lucide-react";
import { useState } from "react";
import { trackEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

type QuickTaskActionsProps = {
  phone?: string | null;
};

export function QuickTaskActions({ phone }: QuickTaskActionsProps) {
  const [copied, setCopied] = useState(false);

  if (!phone) {
    return null;
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(phone || "");
      setCopied(true);
      trackEvent(ANALYTICS_EVENTS.TASK_COPY_PHONE_CLICKED, {
        source: "task_card",
      });
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <a
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink hover:border-ocean hover:text-ocean"
        href={`tel:${phone}`}
        onClick={() =>
          trackEvent(ANALYTICS_EVENTS.TASK_QUICK_CALL_CLICKED, {
            source: "task_card",
          })
        }
      >
        <Phone aria-hidden="true" className="h-4 w-4" />
        Gọi
      </a>
      <button
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink hover:border-ocean hover:text-ocean"
        onClick={handleCopy}
        type="button"
      >
        <Copy aria-hidden="true" className="h-4 w-4" />
        {copied ? "Đã copy" : "Copy số"}
      </button>
    </>
  );
}
