"use client";

import { MapPinned, Search } from "lucide-react";
import { FormEvent, useState } from "react";
import { RouteEndpointAutocompleteInput } from "@/components/discovery/RouteEndpointAutocompleteInput";

type AreaSearchFormProps = {
  initialKeyword?: string;
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

export function AreaSearchForm({
  initialKeyword = "",
  loading,
  onSubmit,
}: AreaSearchFormProps) {
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
      className="rounded-card border border-border-soft bg-surface p-4 shadow-card sm:p-5"
      onSubmit={handleSubmit}
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
          Theo khu vực
        </p>
        <h2 className="mt-2 text-xl font-bold text-text-primary">
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

        <label className="text-sm font-bold text-text-primary">
          Keyword cần tìm
          <div className="relative mt-2">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted"
            />
            <input
              autoComplete="off"
              className="min-h-12 w-full rounded-control border border-border-soft bg-surface py-2 pl-11 pr-3 text-base text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              defaultValue={initialKeyword}
              maxLength={100}
              minLength={2}
              name="keyword"
              placeholder="Ví dụ: nhà thuốc, quán ăn, đại lý, showroom..."
              required
            />
          </div>
        </label>

        <label className="text-sm font-bold text-text-primary">
          Bán kính
          <select
            className="mt-2 min-h-12 w-full rounded-control border border-border-soft bg-surface px-3 py-2 text-base text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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
        aria-busy={loading || undefined}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-primary px-5 py-3 text-base font-bold text-white shadow-soft transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
        disabled={loading}
        type="submit"
      >
        <MapPinned aria-hidden="true" className="h-5 w-5" />
        {loading ? "Đang tìm địa điểm thật..." : "Tìm trong khu vực"}
      </button>
    </form>
  );
}
