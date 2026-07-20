"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl rounded-lg border border-rose-200 bg-rose-50 p-6 text-rose-800">
      <h1 className="text-2xl font-bold">Không thể tải Admin Dashboard</h1>
      <p className="mt-3 text-sm font-semibold leading-6">
        {error.message || "Vui lòng kiểm tra cấu hình Supabase admin schema."}
      </p>
      <button
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-5 py-2.5 text-sm font-bold text-white"
        onClick={reset}
        type="button"
      >
        Tải lại
      </button>
    </div>
  );
}
