"use client";

import { MapPinned, Search } from "lucide-react";
import { FormEvent, useState } from "react";
import { RouteEndpointAutocompleteInput } from "@/components/discovery/RouteEndpointAutocompleteInput";

type AreaSearchFormProps = {
  loading: boolean;
  onSubmit: (input: {
    areaText: string;
    keyword: string;
    radiusMeters: number;
  }) => void;
};

const radiusOptions = [
  { label: "500m", value: 500 },
  { label: "1km", value: 1000 },
  { label: "2km", value: 2000 },
  { label: "3km", value: 3000 },
  { label: "5km", value: 5000 },
] as const;

export function AreaSearchForm({ loading, onSubmit }: AreaSearchFormProps) {
  const [areaText, setAreaText] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onSubmit({
      areaText: areaText.trim(),
      keyword: String(formData.get("keyword") || "").trim(),
      radiusMeters: Number(formData.get("radiusMeters") || 2000),
    });
  }

  return (
    <form
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      onSubmit={handleSubmit}
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-ocean">
          Theo khu vực
        </p>
        <h2 className="mt-2 text-xl font-bold text-ink">
          Tìm khách theo khu vực
        </h2>
      </div>

      <div className="mt-5 grid gap-4">
        <RouteEndpointAutocompleteInput
          label="Khu vực hoặc địa chỉ cụ thể"
          onChange={setAreaText}
          placeholder="Ví dụ: 25 Nguyễn Huệ, Phường Bến Nghé hoặc Quận 1"
          value={areaText}
        />

        <label className="text-sm font-bold text-ink">
          Keyword cần tìm
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
              placeholder="Ví dụ: nhà thuốc, quán ăn, đại lý, showroom..."
              required
            />
          </div>
        </label>

        <label className="text-sm font-bold text-ink">
          Bán kính
          <select
            className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
            defaultValue={2000}
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
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft transition hover:bg-[#5de0b3] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={loading}
        type="submit"
      >
        <MapPinned aria-hidden="true" className="h-5 w-5" />
        {loading ? "Đang tìm địa điểm thật..." : "Tìm trong khu vực"}
      </button>
    </form>
  );
}
