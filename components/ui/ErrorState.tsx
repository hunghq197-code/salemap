"use client";

import { RefreshCcw } from "lucide-react";

type ErrorStateProps = {
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  title?: string;
};

export function ErrorState({
  description = "Không thể tải dữ liệu. Vui lòng thử lại.",
  onRetry,
  retryLabel = "Thử lại",
  title = "Đã có lỗi xảy ra.",
}: ErrorStateProps) {
  return (
    <section className="rounded-lg border border-rose-200 bg-white p-8 text-center shadow-sm">
      <h2 className="text-2xl font-bold text-ink">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-base leading-8 text-slate-600">
        {description}
      </p>
      {onRetry ? (
        <button
          className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-base font-bold text-white transition hover:bg-ocean"
          onClick={onRetry}
          type="button"
        >
          <RefreshCcw aria-hidden="true" className="h-5 w-5" />
          {retryLabel}
        </button>
      ) : null}
    </section>
  );
}
