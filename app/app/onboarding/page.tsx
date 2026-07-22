import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Thiết lập ban đầu - SaleMap",
};

export default function AppOnboardingPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
        Thiết lập SaleMap
      </p>
      <section className="mt-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold leading-tight text-ink">
          Bạn đã hoàn tất thiết lập ban đầu.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Khi cần đổi vai trò, ngành hàng hoặc khu vực sale chính, bạn có thể mở lại form thiết lập.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft hover:bg-[#5de0b3]"
            href="/app/dashboard"
          >
            Về Dashboard
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm hover:border-ocean"
            href="/onboarding?edit=1"
          >
            Cập nhật thông tin
          </Link>
        </div>
      </section>
    </div>
  );
}
