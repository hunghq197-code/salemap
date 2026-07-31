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
  initialKeyword?: string;
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
  initialKeyword = "",
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
      className="rounded-card border border-border-soft bg-surface p-4 shadow-card sm:p-5"
      onSubmit={handleSubmit}
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
          Quanh tôi
        </p>
        <h2 className="mt-2 text-xl font-bold text-text-primary">
          Tìm khách quanh tôi
        </h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          Dùng vị trí hiện tại của thiết bị để quét khách hàng tiềm năng xung quanh bạn.
        </p>
      </div>

      <div className="mt-5 rounded-control bg-surface-muted px-4 py-3">
        {locationLoading ? (
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary">
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
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary">
            <MapPinned aria-hidden="true" className="h-4 w-4" />
            Bấm dùng vị trí hiện tại để bắt đầu.
          </p>
        )}
      </div>

      <button
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control border border-primary/40 bg-surface px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-70"
        disabled={locationLoading || loading}
        onClick={onRequestLocation}
        type="button"
      >
        <LocateFixed aria-hidden="true" className="h-5 w-5" />
        {locationLoading ? "Đang lấy vị trí..." : "Dùng vị trí hiện tại"}
      </button>

      <div className="mt-5 grid gap-4">
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
        aria-busy={loading || undefined}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-primary px-5 py-3 text-base font-bold text-white shadow-soft transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
        disabled={loading || locationLoading || !hasLocation}
        type="submit"
      >
        <Search aria-hidden="true" className="h-5 w-5" />
        {loading ? "Đang quét khách quanh bạn..." : "Quét quanh tôi"}
      </button>
    </form>
  );
}
