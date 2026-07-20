"use client";

import { ArrowRight, Gauge } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { trackQuotaCardViewed } from "@/lib/analytics/client";
import { DAILY_QUOTA_LABELS, type DailyQuotaAction } from "@/lib/constants/quota";
import type { DailyUsage } from "@/lib/data/usage";

type QuotaUsageCardProps = {
  ctaHref?: string;
  ctaLabel?: string;
  items: DailyUsage[];
  planName?: string;
  schemaReady?: boolean;
  sourcePage: string;
  title?: string;
};

function getPercent(used: number, limit: number) {
  if (limit <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((used / limit) * 100));
}

function getLabel(actionType: string) {
  return DAILY_QUOTA_LABELS[actionType as DailyQuotaAction] ?? {
    label: actionType,
    shortLabel: actionType,
    unit: "lượt",
  };
}

export function QuotaUsageCard({
  ctaHref = "/app/billing",
  ctaLabel = "Xem gói sử dụng",
  items,
  planName,
  schemaReady = true,
  sourcePage,
  title = "Lượt sử dụng hôm nay",
}: QuotaUsageCardProps) {
  useEffect(() => {
    trackQuotaCardViewed({ sourcePage });
  }, [sourcePage]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-ocean/10 text-ocean">
            <Gauge aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-ink">{title}</h2>
            <p className="mt-2 text-base leading-7 text-slate-600">
              Theo dõi số lượt dùng trong ngày để chủ động tìm khách, lưu lead và
              xuất dữ liệu.
            </p>
            {planName ? (
              <p className="mt-2 text-sm font-bold text-ocean">
                Quota theo gói hiện tại: {planName}
              </p>
            ) : null}
          </div>
        </div>
        <Link
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm transition hover:border-ocean sm:w-auto"
          href={ctaHref}
        >
          {ctaLabel}
          <ArrowRight aria-hidden="true" className="h-5 w-5" />
        </Link>
      </div>

      {!schemaReady ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
          Chưa bật bảng quota trong Supabase. Hãy chạy schema map discovery để
          cập nhật số lượt thật.
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {items.map((item) => {
          const label = getLabel(item.actionType);
          const percent = getPercent(item.used, item.limit);
          const isLow = item.remaining <= Math.ceil(item.limit * 0.2);

          return (
            <div
              className="rounded-lg border border-slate-200 bg-cloud/40 p-4"
              key={item.actionType}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-ink">{label.shortLabel}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Còn {item.remaining} {label.unit}
                  </p>
                </div>
                <p className="text-sm font-bold text-ocean">
                  {item.used}/{item.limit}
                </p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={[
                    "h-full rounded-full transition-all",
                    isLow ? "bg-amber-500" : "bg-ocean",
                  ].join(" ")}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
