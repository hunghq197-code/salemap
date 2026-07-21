"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function isPlainLeftClick(event: MouseEvent) {
  return (
    event.button === 0 &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey
  );
}

function findAnchor(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest("a[href]");
}

function getNavigationTargetKey(anchor: HTMLAnchorElement) {
  if (anchor.target && anchor.target !== "_self") {
    return null;
  }

  if (anchor.hasAttribute("download")) {
    return null;
  }

  const targetUrl = new URL(anchor.href, window.location.href);
  const currentUrl = new URL(window.location.href);

  if (targetUrl.origin !== currentUrl.origin) {
    return null;
  }

  if (
    targetUrl.pathname === currentUrl.pathname &&
    targetUrl.search === currentUrl.search
  ) {
    return null;
  }

  return `${targetUrl.pathname}?${targetUrl.searchParams.toString()}`;
}

export function RouteTransitionProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendingRouteKey, setPendingRouteKey] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const isNavigating = pendingRouteKey !== null && pendingRouteKey !== routeKey;

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || !isPlainLeftClick(event)) {
        return;
      }

      const anchor = findAnchor(event.target);
      const targetRouteKey =
        anchor instanceof HTMLAnchorElement ? getNavigationTargetKey(anchor) : null;

      if (!targetRouteKey) {
        return;
      }

      setPendingRouteKey(targetRouteKey);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setPendingRouteKey(null);
        timeoutRef.current = null;
      }, 8000);
    }

    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (pendingRouteKey !== routeKey || !timeoutRef.current) {
      return;
    }

    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, [pendingRouteKey, routeKey]);

  return (
    <div
      aria-hidden="true"
      className={[
        "pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-transparent transition-opacity duration-150",
        isNavigating ? "opacity-100" : "opacity-0",
      ].join(" ")}
    >
      <div className="h-full origin-left bg-mint shadow-[0_0_20px_rgba(34,197,139,0.55)] motion-safe:animate-[salemap-route-progress_1.15s_ease-in-out_infinite]" />
    </div>
  );
}
