"use client";

import { LocateFixed, Search } from "lucide-react";
import type { FormEvent } from "react";

type NearMeSearchFormProps = {
  loading: boolean;
  onSubmit: (input: { keyword: string; radiusMeters: number }) => void;
};

const radiusOptions = [
  { label: "1km", value: 1000 },
  { label: "3km", value: 3000 },
  { label: "5km", value: 5000 },
  { label: "10km", value: 10000 },
] as const;

export function NearMeSearchForm({ loading, onSubmit }: NearMeSearchFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSubmit({
      keyword: String(formData.get("keyword") || ""),
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
          Từ khóa khách muốn tìm
          <div className="relative mt-2">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              className="min-h-12 w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              minLength={2}
              name="keyword"
              placeholder="Ví dụ: nhà thuốc, quán ăn, spa, đại lý vật liệu xây dựng..."
              required
            />
          </div>
        </label>
        <label className="text-sm font-bold text-ink">
          Bán kính
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
        <LocateFixed aria-hidden="true" className="h-5 w-5" />
        {loading ? "Đang tìm khách quanh bạn..." : "Tìm quanh tôi"}
      </button>
    </form>
  );
}
