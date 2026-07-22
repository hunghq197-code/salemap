import { Eye, Pin, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { SavedViewActions } from "@/components/saved-views/SavedViewActions";
import { getSavedViewsWithCounts } from "@/lib/data/lead-saved-views";

export const dynamic = "force-dynamic";

function formatDate(value?: string | null) {
  if (!value) return "Chưa mở";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function ViewCard({
  view,
}: {
  view: Awaited<ReturnType<typeof getSavedViewsWithCounts>>[number];
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            {view.is_pinned ? (
              <span className="inline-flex min-h-7 items-center gap-1 rounded-full bg-mint/15 px-3 py-1 text-xs font-bold text-ocean">
                <Pin aria-hidden="true" className="h-3 w-3" />
                Đã ghim
              </span>
            ) : null}
            <span className="inline-flex min-h-7 items-center rounded-full bg-cloud px-3 py-1 text-xs font-bold text-slate-600">
              {view.view_type === "custom" ? "Của bạn" : "Góc nhìn thông minh"}
            </span>
          </div>
          <h2 className="mt-3 text-xl font-bold text-ink">{view.name}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {view.description || view.filterSummary.join(" - ")}
          </p>
        </div>
        <span className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg bg-ocean/10 px-3 text-xl font-bold text-ocean">
          {view.count}
        </span>
      </div>
      <p className="mt-3 text-xs font-semibold text-slate-500">
        Mở lần cuối: {formatDate(view.last_used_at)}
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ocean"
          href={`/app/leads/views/${view.id}`}
        >
          <Eye aria-hidden="true" className="h-4 w-4" />
          Mở
        </Link>
        <SavedViewActions
          isPinned={view.is_pinned}
          isSystem={view.is_system}
          viewId={view.id}
        />
      </div>
    </article>
  );
}

export default async function LeadViewsPage() {
  const views = await getSavedViewsWithCounts();
  const pinnedViews = views.filter((view) => view.is_pinned);
  const smartViews = views.filter((view) => view.view_type !== "custom");
  const customViews = views.filter((view) => view.view_type === "custom");

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            Saved views
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Góc nhìn lead
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
            Lưu các bộ lọc hay dùng để mở nhanh danh sách lead quan trọng mỗi ngày.
          </p>
        </div>
        <Link
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft hover:bg-[#5de0b3]"
          href="/app/leads"
        >
          <Plus aria-hidden="true" className="h-5 w-5" />
          Tạo từ bộ lọc lead
        </Link>
      </div>

      <section className="mt-6">
        <h2 className="text-xl font-bold text-ink">Góc nhìn được ghim</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pinnedViews.length > 0 ? (
            pinnedViews.map((view) => <ViewCard key={view.id} view={view} />)
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-5 text-base leading-7 text-slate-600 shadow-sm md:col-span-2 xl:col-span-3">
              Chưa có góc nhìn nào được ghim. Hãy ghim góc nhìn quan trọng để mở nhanh từ
              dashboard.
            </div>
          )}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center gap-2">
          <Sparkles aria-hidden="true" className="h-5 w-5 text-ocean" />
          <h2 className="text-xl font-bold text-ink">Góc nhìn thông minh mặc định</h2>
        </div>
        <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {smartViews.map((view) => (
            <ViewCard key={view.id} view={view} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-ink">Góc nhìn của bạn</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {customViews.length > 0 ? (
            customViews.map((view) => <ViewCard key={view.id} view={view} />)
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-5 text-base leading-7 text-slate-600 shadow-sm md:col-span-2 xl:col-span-3">
              Bạn chưa có góc nhìn riêng. Vào danh sách lead, chọn bộ lọc rồi bấm lưu thành
              góc nhìn.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
