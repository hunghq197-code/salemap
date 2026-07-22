"use client";

import {
  AlertTriangle,
  CheckCircle2,
  LocateFixed,
  MapPinned,
  Search,
} from "lucide-react";
import type { FormEvent } from "react";

type NearMeSearchFormProps = {
  hasLocation: boolean;
  loading: boolean;
  locationAccuracyMeters?: number | null;
  locationError?: string | null;
  locationLoading: boolean;
  onRequestLocation: () => void;
  onSubmit: (input: { keyword: string; radiusMeters: number }) => void;
};

const radiusOptions = [
  { label: "500m", value: 500 },
  { label: "1km", value: 1000 },
  { label: "2km", value: 2000 },
  { label: "3km", value: 3000 },
  { label: "5km", value: 5000 },
] as const;

export function NearMeSearchForm({
  hasLocation,
  loading,
  locationAccuracyMeters,
  locationError,
  locationLoading,
  onRequestLocation,
  onSubmit,
}: NearMeSearchFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onSubmit({
      keyword: String(formData.get("keyword") || "").trim(),
      radiusMeters: Number(formData.get("radiusMeters") || 1000),
    });
  }

  return (
    <form
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      onSubmit={handleSubmit}
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-ocean">
          Quanh tôi
        </p>
        <h2 className="mt-2 text-xl font-bold text-ink">
          Tìm khách quanh tôi
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Dùng vị trí hiện tại của thiết bị để quét khách hàng tiềm năng xung quanh bạn.
        </p>
      </div>

      <div className="mt-5 rounded-lg bg-cloud px-4 py-3">
        {locationLoading ? (
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
            <LocateFixed aria-hidden="true" className="h-4 w-4 animate-pulse" />
            Đang lấy vị trí thiết bị...
          </p>
        ) : hasLocation ? (
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <CheckCircle2 aria-hidden="true" className="h-5 w-5 flex-none" />
            Đã xác định vị trí của bạn
            {locationAccuracyMeters != null
              ? `, độ chính xác khoảng ${Math.max(
                  1,
                  Math.round(locationAccuracyMeters),
                )}m`
              : ""}
            .
          </p>
        ) : locationError ? (
          <p className="flex items-start gap-2 text-sm font-semibold leading-6 text-amber-700">
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 flex-none"
            />
            {locationError}
          </p>
        ) : (
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
            <MapPinned aria-hidden="true" className="h-4 w-4" />
            Bấm dùng vị trí hiện tại để bắt đầu.
          </p>
        )}
      </div>

      <button
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-ocean bg-white px-4 py-2 text-sm font-bold text-ocean transition hover:bg-ocean hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
        disabled={locationLoading || loading}
        onClick={onRequestLocation}
        type="button"
      >
        <LocateFixed aria-hidden="true" className="h-5 w-5" />
        {locationLoading ? "Đang lấy vị trí..." : "Dùng vị trí hiện tại"}
      </button>

      <div className="mt-5 grid gap-4">
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
            defaultValue={1000}
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
        disabled={loading || locationLoading || !hasLocation}
        type="submit"
      >
        <Search aria-hidden="true" className="h-5 w-5" />
        {loading ? "Đang quét khách quanh bạn..." : "Quét quanh tôi"}
      </button>
    </form>
  );
}
