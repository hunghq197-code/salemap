"use client";

import { ArrowRight, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import {
  trackQuotaLimitReached,
  trackQuotaLimitWarningViewed,
} from "@/lib/analytics/client";
import { DAILY_QUOTA_LABELS, type DailyQuotaAction } from "@/lib/constants/quota";

type QuotaWarningProps = {
  actionType?: string;
  className?: string;
  limit: number;
  remaining: number;
  reached?: boolean;
  used: number;
};

function getLabel(actionType?: string) {
  if (!actionType) {
    return "lượt sử dụng";
  }

  return DAILY_QUOTA_LABELS[actionType as DailyQuotaAction]?.label || "lượt sử dụng";
}

export function QuotaWarning({
  actionType,
  className,
  limit,
  remaining,
  reached,
  used,
}: QuotaWarningProps) {
  const isReached = reached || remaining <= 0;
  const isLow = remaining <= Math.ceil(limit * 0.2);

  useEffect(() => {
    if (!isReached && !isLow) {
      return;
    }

    const payload = { actionType, limit, remaining, used };

    if (isReached) {
      trackQuotaLimitReached(payload);
      return;
    }

    trackQuotaLimitWarningViewed(payload);
  }, [actionType, isLow, isReached, limit, remaining, used]);

  if (!isReached && !isLow) {
    return null;
  }

  const label = getLabel(actionType);

  return (
    <div
      className={[
        "rounded-lg border px-4 py-3 text-sm font-semibold leading-6",
        isReached
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-amber-200 bg-amber-50 text-amber-800",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <TriangleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p>
              {isReached
                ? "Bạn đã dùng hết lượt hôm nay. Vui lòng quay lại vào ngày mai."
                : "Bạn sắp hết lượt sử dụng hôm nay."}
            </p>
            <p className="mt-1 font-medium">
              {label}: {used}/{limit}, còn {Math.max(0, remaining)} lượt.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-ink shadow-sm transition hover:text-ocean"
            href="/app/billing"
          >
            Xem gói sử dụng
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          {isReached ? (
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-ocean"
              href="/app/billing"
            >
              Quan tâm nâng cấp
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
