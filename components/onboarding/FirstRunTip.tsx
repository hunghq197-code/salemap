"use client";

import { Lightbulb, X } from "lucide-react";
import { useEffect, useState } from "react";

type FirstRunTipProps = {
  message: string;
  storageKey: string;
};

export function FirstRunTip({ message, storageKey }: FirstRunTipProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDismissed(window.localStorage.getItem(storageKey) === "1");
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [storageKey]);

  function dismiss() {
    window.localStorage.setItem(storageKey, "1");
    setDismissed(true);
  }

  if (dismissed) {
    return null;
  }

  return (
    <div className="mt-5 flex gap-3 rounded-lg border border-ocean/20 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-700 shadow-sm">
      <Lightbulb aria-hidden="true" className="mt-0.5 h-5 w-5 flex-none text-ocean" />
      <p className="flex-1">{message}</p>
      <button
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-ocean hover:text-ocean"
        onClick={dismiss}
        type="button"
      >
        <X aria-hidden="true" className="h-4 w-4" />
        <span className="sr-only">Đóng gợi ý</span>
      </button>
    </div>
  );
}
