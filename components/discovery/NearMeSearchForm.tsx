"use client";

import { CheckCircle2, LocateFixed, Search } from "lucide-react";
import type { FormEvent } from "react";

type NearMeSearchFormProps = {
  loading: boolean;
  locationAccuracyMeters?: number | null;
  onSubmit: (input: { keyword: string; radiusMeters: number }) => void;
};

const radiusOptions = [
  { label: "1 km", value: 1000 },
  { label: "3 km", value: 3000 },
  { label: "5 km", value: 5000 },
  { label: "10 km", value: 10000 },
] as const;

export function NearMeSearchForm({
  loading,
  locationAccuracyMeters,
  onSubmit,
}: NearMeSearchFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onSubmit({
      keyword: String(formData.get("keyword") || "").trim(),
      radiusMeters: Number(formData.get("radiusMeters") || 3000),
    });
  }

  return (
    <form
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
        <label className="text-sm font-bold text-ink">
          Bạn muốn tìm địa điểm nào?
          <div className="relative mt-2">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            />
            <input
              autoComplete="off"
              className="min-h-12 w-full rounded-lg border border-slate-200 bg-white py-2 pl-11 pr-3 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              maxLength={100}
              minLength={2}
              name="keyword"
              placeholder="Ví dụ: dầu nhớt, nhà thuốc, quán ăn, công ty phần mềm..."
              required
            />
          </div>
        </label>

        <label className="text-sm font-bold text-ink">
          Tìm trong bán kính
          <select
            className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
            defaultValue={3000}
            name="radiusMeters"
          >
            {radiusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft hover:bg-[#5de0b3] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          disabled={loading}
          type="submit"
        >
          <LocateFixed aria-hidden="true" className="h-5 w-5" />
          {loading ? "Đang xác định vị trí và tìm kiếm..." : "Tìm quanh vị trí của tôi"}
        </button>

        {locationAccuracyMeters != null ? (
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <CheckCircle2 aria-hidden="true" className="h-5 w-5 flex-none" />
            Đã lấy vị trí, độ chính xác khoảng {Math.max(1, Math.round(locationAccuracyMeters))} m
          </p>
        ) : (
          <p className="text-sm leading-6 text-slate-500">
            Trình duyệt sẽ xin quyền vị trí khi bạn bấm tìm.
          </p>
        )}
      </div>
    </form>
  );
}
