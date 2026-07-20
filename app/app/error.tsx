"use client";

import { RefreshCcw } from "lucide-react";

type ProductAppErrorProps = {
  reset: () => void;
};

export default function ProductAppError({ reset }: ProductAppErrorProps) {
  return (
    <div className="mx-auto max-w-3xl rounded-lg border border-rose-200 bg-white p-6 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-ink">Không thể tải dữ liệu</h1>
      <p className="mx-auto mt-3 max-w-xl text-base leading-8 text-slate-600">
        Không thể tải dữ liệu. Vui lòng thử lại.
      </p>
      <button
        className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-bold text-white hover:bg-ocean"
        onClick={reset}
        type="button"
      >
        <RefreshCcw aria-hidden="true" className="h-4 w-4" />
        Thử lại
      </button>
    </div>
  );
}
