import { ArrowLeft, Target } from "lucide-react";
import Link from "next/link";
import { createSalesGoalAction } from "@/app/app/analytics/goals/actions";
import { Toast } from "@/components/ui/Toast";
import {
  GOAL_PERIODS,
  SALES_METRICS,
} from "@/lib/constants/sales-analytics";

export const dynamic = "force-dynamic";

type NewGoalPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewSalesGoalPage(props: NewGoalPageProps) {
  const searchParams = await props.searchParams;
  return (
    <div className="mx-auto max-w-3xl">
      <Toast code={getString(searchParams?.toast)} />
      <Link
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink shadow-sm hover:border-ocean"
        href="/app/analytics/goals"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Quay lại mục tiêu
      </Link>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-mint/15 text-ocean">
            <Target aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
              Mục tiêu cá nhân
            </p>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-ink">
              Tạo mục tiêu
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Chọn một chỉ số nhỏ, dễ đo để theo dõi tiến độ làm việc hằng ngày hoặc hằng tuần.
            </p>
          </div>
        </div>

        <form action={createSalesGoalAction} className="mt-6 grid gap-5">
          <label className="text-sm font-bold text-ink">
            Tên mục tiêu
            <input
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              maxLength={100}
              name="name"
              placeholder="Ví dụ: Tạo 10 lead hôm nay"
              required
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-ink">
              Chỉ số cần theo dõi
              <select
                className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
                name="metricKey"
                required
              >
                {Object.entries(SALES_METRICS).map(([key, metric]) => (
                  <option key={key} value={key}>
                    {metric.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-bold text-ink">
              Giá trị mục tiêu
              <input
                className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
                min={1}
                name="targetValue"
                required
                type="number"
              />
            </label>
          </div>

          <label className="text-sm font-bold text-ink">
            Chu kỳ
            <select
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              defaultValue="weekly"
              name="periodType"
              required
            >
              {Object.entries(GOAL_PERIODS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-ink">
              Ngày bắt đầu nếu tùy chọn
              <input
                className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
                name="periodStart"
                type="date"
              />
            </label>
            <label className="text-sm font-bold text-ink">
              Ngày kết thúc nếu tùy chọn
              <input
                className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
                name="periodEnd"
                type="date"
              />
            </label>
          </div>

          <label className="inline-flex items-center gap-3 rounded-lg bg-cloud px-4 py-3 text-sm font-bold text-ink">
            <input className="h-5 w-5 accent-ocean" name="isPinned" type="checkbox" />
            Ghim lên dashboard
          </label>

          <button
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft transition hover:bg-[#5de0b3]"
            type="submit"
          >
            Tạo mục tiêu
          </button>
        </form>
      </section>
    </div>
  );
}
