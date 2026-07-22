import { ArrowRight, Info, ListChecks, Plus } from "lucide-react";
import Link from "next/link";
import { CadenceTemplateActions } from "@/components/cadences/CadenceTemplateActions";
import {
  getCadenceCategoryLabel,
  getCadenceTaskTypeLabel,
} from "@/lib/constants/cadences";
import { getCadenceTemplates } from "@/lib/data/cadences";
import { listTaskLeadOptions } from "@/lib/data/tasks";

export const dynamic = "force-dynamic";

export default async function CadencesPage() {
  const [templateResult, leadOptions] = await Promise.all([
    getCadenceTemplates({ limit: 80 }),
    listTaskLeadOptions(),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            Sales cadence
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Quy trình chăm sóc
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Tạo template chăm sóc lead theo từng mốc ngày, rồi áp dụng để SaleMap
            tự sinh việc cần làm trong Task Center.
          </p>
        </div>
        <Link
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft hover:bg-[#5de0b3]"
          href="/app/cadences/new"
        >
          <Plus aria-hidden="true" className="h-5 w-5" />
          Tạo quy trình
        </Link>
      </div>

      {!templateResult.schemaReady ? (
        <div className="mt-6 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
          <Info aria-hidden="true" className="mt-0.5 h-5 w-5 flex-none" />
          Chưa thấy bảng cadence trong Supabase. Hãy chạy `supabase/cadences.sql`,
          sau đó chạy `supabase/seed-cadence-templates.sql`.
        </div>
      ) : null}

      {templateResult.items.length > 0 ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {templateResult.items.map((template) => (
            <article
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-ocean/60"
              key={template.id}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex min-h-7 items-center rounded-full bg-ocean/10 px-3 py-1 text-xs font-bold text-ocean">
                      {getCadenceCategoryLabel(template.category)}
                    </span>
                    {template.isSystem ? (
                      <span className="inline-flex min-h-7 items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                        Hệ thống
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-3 text-xl font-bold leading-7 text-ink">
                    {template.name}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {template.description || "Quy trình chăm sóc lead."}
                  </p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-mint/15 text-ocean">
                  <ListChecks aria-hidden="true" className="h-5 w-5" />
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div className="rounded-lg bg-cloud px-3 py-2">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Bước
                  </p>
                  <p className="mt-1 text-lg font-bold text-ink">
                    {template.stepsCount || template.steps?.length || 0}
                  </p>
                </div>
                <div className="rounded-lg bg-cloud px-3 py-2">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Lead active
                  </p>
                  <p className="mt-1 text-lg font-bold text-ink">
                    {template.activeLeadsCount || 0}
                  </p>
                </div>
                <div className="rounded-lg bg-cloud px-3 py-2">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Việc đầu
                  </p>
                  <p className="mt-1 truncate text-sm font-bold text-ink">
                    {getCadenceTaskTypeLabel(template.steps?.[0]?.taskType)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink hover:border-ocean"
                  href={`/app/cadences/${template.id}`}
                >
                  Xem chi tiết
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
              <CadenceTemplateActions
                leadOptions={leadOptions}
                templateId={template.id}
                templateIsSystem={template.isSystem}
              />
            </article>
          ))}
        </div>
      ) : (
        <section className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm">
          <h2 className="text-xl font-bold text-ink">Chưa có quy trình chăm sóc</h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Chạy seed template hệ thống hoặc tạo quy trình đầu tiên cho cách sale
            của bạn.
          </p>
          <Link
            className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink"
            href="/app/cadences/new"
          >
            <Plus aria-hidden="true" className="h-5 w-5" />
            Tạo quy trình
          </Link>
        </section>
      )}
    </div>
  );
}
