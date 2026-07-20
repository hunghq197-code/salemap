"use client";

import { CheckCircle2, Circle, MapPinned, Plus, Route } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import {
  trackFirstRunGuideCtaClicked,
  trackFirstRunGuideViewed,
} from "@/lib/analytics/client";

type FirstRunGuideCardProps = {
  completed: {
    hasLead: boolean;
    hasNote: boolean;
    hasReminder: boolean;
  };
};

const steps = [
  { key: "hasLead", label: "Thêm lead đầu tiên" },
  { key: "hasNote", label: "Thêm ghi chú sau khi liên hệ" },
  { key: "hasReminder", label: "Đặt lịch follow-up" },
  { key: "areaSearch", label: "Tìm thử khách theo khu vực" },
  { key: "routeSearch", label: "Tìm thử khách dọc tuyến" },
] as const;

export function FirstRunGuideCard({ completed }: FirstRunGuideCardProps) {
  useEffect(() => {
    trackFirstRunGuideViewed();
  }, []);

  function isDone(key: (typeof steps)[number]["key"]) {
    if (key === "hasLead") return completed.hasLead;
    if (key === "hasNote") return completed.hasNote;
    if (key === "hasReminder") return completed.hasReminder;

    return false;
  }

  return (
    <section className="mt-6 rounded-lg border border-ocean/20 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ocean">
            First run
          </p>
          <h2 className="mt-2 text-2xl font-bold text-ink">
            Bắt đầu với SaleMap trong 5 phút
          </h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {steps.map((step) => {
              const done = isDone(step.key);
              const Icon = done ? CheckCircle2 : Circle;

              return (
                <div
                  className="flex items-center gap-3 rounded-lg bg-cloud px-3 py-2 text-sm font-bold text-slate-700"
                  key={step.key}
                >
                  <Icon
                    aria-hidden="true"
                    className={done ? "h-4 w-4 text-ocean" : "h-4 w-4 text-slate-400"}
                  />
                  {step.label}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft transition hover:bg-[#5de0b3]"
            href="/app/leads?create=1"
            onClick={() => trackFirstRunGuideCtaClicked("create_first_lead")}
          >
            <Plus aria-hidden="true" className="h-5 w-5" />
            Thêm lead đầu tiên
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm transition hover:border-ocean"
            href="/app/huong-dan"
            onClick={() => trackFirstRunGuideCtaClicked("view_beta_guide")}
          >
            <MapPinned aria-hidden="true" className="h-5 w-5" />
            Xem hướng dẫn
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm transition hover:border-ocean"
            href="/app/discover?tab=route"
            onClick={() => trackFirstRunGuideCtaClicked("try_route_search")}
          >
            <Route aria-hidden="true" className="h-5 w-5" />
            Tìm dọc tuyến
          </Link>
        </div>
      </div>
    </section>
  );
}
