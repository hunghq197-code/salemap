"use client";

import { MapPinned, Search } from "lucide-react";
import type { FormEvent } from "react";

type AreaSearchFormProps = {
  loading: boolean;
  onSubmit: (input: {
    areaText: string;
    keyword: string;
    radiusMeters: number;
  }) => void;
};

const radiusOptions = [
  { label: "1 km", value: 1000 },
  { label: "3 km", value: 3000 },
  { label: "5 km", value: 5000 },
  { label: "10 km", value: 10000 },
] as const;

export function AreaSearchForm({ loading, onSubmit }: AreaSearchFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onSubmit({
      areaText: String(formData.get("areaText") || "").trim(),
      keyword: String(formData.get("keyword") || "").trim(),
      radiusMeters: Number(formData.get("radiusMeters") || 3000),
    });
  }

  return (
    <form
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_180px]">
        <label className="text-sm font-bold text-ink">
          Tìm quanh khu vực
          <div className="relative mt-2">
            <MapPinned
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            />
            <input
              autoComplete="street-address"
              className="min-h-12 w-full rounded-lg border border-slate-200 bg-white py-2 pl-11 pr-3 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              maxLength={200}
              minLength={2}
              name="areaText"
              placeholder="Ví dụ: Thủ Đức, TP.HCM"
              required
            />
          </div>
        </label>

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
              placeholder="Ví dụ: dầu nhớt, nhà thuốc, quán ăn..."
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

      <button
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft hover:bg-[#5de0b3] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        disabled={loading}
        type="submit"
      >
        <MapPinned aria-hidden="true" className="h-5 w-5" />
        {loading ? "Đang tìm địa điểm thật..." : "Tìm trong khu vực này"}
      </button>
    </form>
  );
}
