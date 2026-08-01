import Link from "next/link";
import { ANALYTICS_PERIODS } from "@/lib/constants/sales-analytics";
import type { AnalyticsPeriodInput } from "@/lib/validators/sales-analytics";

type AnalyticsFilterBarProps = {
  period: AnalyticsPeriodInput;
};

export function AnalyticsFilterBar({ period }: AnalyticsFilterBarProps) {
  const activeCustom = period.period === "custom" && period.customFrom && period.customTo;
  const activeFilterCount = activeCustom ? 2 : 1;

  return (
    <form
      className="rounded-card border border-border-soft bg-surface p-4 shadow-card"
      method="get"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="grid flex-1 gap-3 md:grid-cols-3">
          <label className="text-sm font-bold text-text-primary">
            Khoảng thời gian
            <select
              className="mt-2 min-h-12 w-full rounded-control border border-border-soft bg-surface px-3 py-2 text-base text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              defaultValue={period.period}
              name="period"
            >
              {Object.entries(ANALYTICS_PERIODS).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold text-text-primary">
            Từ ngày
            <input
              className="mt-2 min-h-12 w-full rounded-control border border-border-soft bg-surface px-3 py-2 text-base text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              defaultValue={period.customFrom}
              name="customFrom"
              type="date"
            />
          </label>
          <label className="text-sm font-bold text-text-primary">
            Đến ngày
            <input
              className="mt-2 min-h-12 w-full rounded-control border border-border-soft bg-surface px-3 py-2 text-base text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              defaultValue={period.customTo}
              name="customTo"
              type="date"
            />
          </label>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-control bg-primary px-5 py-3 text-base font-bold text-white shadow-soft transition hover:bg-primary-hover"
            type="submit"
          >
            Áp dụng
          </button>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-control border border-border-soft bg-surface px-5 py-3 text-base font-bold text-text-primary shadow-sm transition hover:border-primary/40 hover:text-primary"
            href="/app/analytics"
          >
            Đặt lại
          </Link>
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold leading-6 text-text-secondary">
        Đang dùng {activeFilterCount} bộ lọc. Search params chỉ chứa preset và ngày, không chứa PII.
      </p>
    </form>
  );
}
