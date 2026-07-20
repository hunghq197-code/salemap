import type { ReactNode } from "react";
import Link from "next/link";

type AdminFilterBarProps = {
  action: string;
  children: ReactNode;
  resetHref: string;
};

export function AdminFilterBar({ action, children, resetHref }: AdminFilterBarProps) {
  return (
    <form
      action={action}
      className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{children}</div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-ocean"
          type="submit"
        >
          Lọc dữ liệu
        </button>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-ink transition hover:border-ocean"
          href={resetHref}
        >
          Xóa lọc
        </Link>
      </div>
    </form>
  );
}
