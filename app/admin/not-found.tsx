import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">404</p>
      <h1 className="mt-3 text-3xl font-bold text-ink">Không tìm thấy trang admin</h1>
      <p className="mx-auto mt-3 max-w-2xl text-base leading-8 text-slate-600">
        Trang admin này chưa tồn tại hoặc đã được đổi đường dẫn.
      </p>
      <Link
        className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-base font-bold text-white"
        href="/admin"
      >
        <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        Quay lại admin
      </Link>
    </div>
  );
}
