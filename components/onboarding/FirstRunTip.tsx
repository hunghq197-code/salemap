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
    <div className="mt-5 flex gap-3 rounded-card border border-primary/20 bg-surface px-4 py-3 text-sm font-semibold leading-6 text-text-secondary shadow-card">
      <Lightbulb aria-hidden="true" className="mt-0.5 h-5 w-5 flex-none text-primary" />
      <p className="flex-1">{message}</p>
      <button
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-border-soft text-text-muted transition hover:border-primary/40 hover:text-primary"
        onClick={dismiss}
        type="button"
      >
        <X aria-hidden="true" className="h-4 w-4" />
        <span className="sr-only">Đóng gợi ý</span>
      </button>
    </div>
  );
}
