import { CheckCircle2, Circle, Info } from "lucide-react";
import Link from "next/link";
import type { BETA_CHECKLIST_ITEMS, BetaChecklistKey } from "@/lib/constants/beta-checklist";

type BetaChecklistCardProps = {
  completed: Set<BetaChecklistKey>;
  done: number;
  items: typeof BETA_CHECKLIST_ITEMS;
  schemaReady: boolean;
  total: number;
};

export function BetaChecklistCard({
  completed,
  done,
  items,
  schemaReady,
  total,
}: BetaChecklistCardProps) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ocean">
            Checklist
          </p>
          <h2 className="mt-2 text-2xl font-bold text-ink">Checklist dùng thử</h2>
          <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
            Hoàn thành các bước dưới đây để trải nghiệm đầy đủ luồng SaleMap.
          </p>
        </div>
        <div className="rounded-lg bg-cloud px-4 py-3 text-sm font-bold text-ink">
          Đã hoàn thành {done}/{total} bước
        </div>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-cloud">
        <div
          className="h-full rounded-full bg-mint transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      {!schemaReady ? (
        <div className="mt-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
          <Info aria-hidden="true" className="mt-0.5 h-5 w-5 flex-none" />
          Checklist sẽ lưu tiến độ sau khi bạn chạy file SQL cần thiết trong Supabase.
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {items.map((item) => {
          const isDone = completed.has(item.key);
          const Icon = isDone ? CheckCircle2 : Circle;

          return (
            <article
              className="flex min-h-[132px] flex-col gap-4 rounded-lg border border-slate-200 bg-cloud/40 p-4 sm:flex-row sm:items-start sm:justify-between"
              key={item.key}
            >
              <div className="flex min-w-0 gap-3">
                <Icon
                  aria-hidden="true"
                  className={isDone ? "mt-1 h-5 w-5 flex-none text-emerald-600" : "mt-1 h-5 w-5 flex-none text-slate-400"}
                />
                <div className="min-w-0">
                  <h3 className="text-base font-bold leading-6 text-ink">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              </div>
              <Link
                className={[
                  "inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg px-4 py-2 text-sm font-bold transition",
                  isDone
                    ? "border border-slate-200 bg-white text-slate-600 hover:border-ocean"
                    : "bg-ink text-white hover:bg-ocean",
                ].join(" ")}
                href={item.href}
              >
                {isDone ? "Xem lại" : "Làm ngay"}
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
