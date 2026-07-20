import { ArrowLeft, SearchCheck } from "lucide-react";
import Link from "next/link";
import { CleanupScanButtons } from "@/components/cleanup/CleanupScanButtons";
import { DuplicateGroupActions } from "@/components/cleanup/DuplicateGroupActions";
import { LEAD_DUPLICATE_REASONS } from "@/lib/constants/lead-cleanup";
import { getMergeGroups } from "@/lib/leads/duplicate-detection";

export const dynamic = "force-dynamic";

type DuplicatesPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function reasonLabel(reason?: string | null) {
  return reason && reason in LEAD_DUPLICATE_REASONS
    ? LEAD_DUPLICATE_REASONS[reason as keyof typeof LEAD_DUPLICATE_REASONS]
    : "Co kha nang trung";
}

export default async function DuplicateGroupsPage(props: DuplicatesPageProps) {
  const searchParams = await props.searchParams;
  const page = Number(getString(searchParams?.page) || 1);
  const status = getString(searchParams?.status) || "suggested";
  const result = await getMergeGroups({ page, status });

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-ocean hover:text-ink"
        href="/app/leads/cleanup"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Ve trung tam don du lieu
      </Link>

      <div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            Duplicate leads
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Lead co kha nang trung
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
            SaleMap phat hien cac lead nay co the la cung mot khach hang. Hay xem tung nhom
            truoc khi gop.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <CleanupScanButtons />
      </div>

      <div className="mt-6 space-y-4">
        {result.items.length > 0 ? (
          result.items.map((group) => (
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={group.id}>
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex min-h-8 items-center rounded-full bg-mint/15 px-3 py-1 text-xs font-bold text-ocean">
                      {group.lead_ids.length} lead
                    </span>
                    <span className="inline-flex min-h-8 items-center rounded-full bg-cloud px-3 py-1 text-xs font-bold text-slate-600">
                      {reasonLabel(group.duplicate_reason)}
                    </span>
                    <span className="inline-flex min-h-8 items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                      Confidence {group.confidence_score ?? 0}%
                    </span>
                  </div>
                  <h2 className="mt-4 text-xl font-bold text-ink">
                    {group.leads.map((lead) => lead.name).join(" / ") || "Nhom lead trung"}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {group.leads
                      .map((lead) => lead.phone || lead.email || lead.website || lead.address)
                      .filter(Boolean)
                      .slice(0, 3)
                      .join(" - ") || "Chua co thong tin overlap de hien thi."}
                  </p>
                </div>
                <DuplicateGroupActions groupId={group.id} />
              </div>
            </article>
          ))
        ) : (
          <section className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-mint/15 text-ocean">
              <SearchCheck aria-hidden="true" className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-ink">Chua phat hien lead trung nao.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-8 text-slate-600">
              Bam quet lai neu ban vua import them lead hoac cap nhat du lieu.
            </p>
          </section>
        )}
      </div>

      {result.totalPages > 1 ? (
        <div className="mt-6 flex justify-center gap-2">
          {result.page > 1 ? (
            <Link className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink" href={`/app/leads/cleanup/duplicates?page=${result.page - 1}`}>
              Trang truoc
            </Link>
          ) : null}
          {result.page < result.totalPages ? (
            <Link className="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white" href={`/app/leads/cleanup/duplicates?page=${result.page + 1}`}>
              Trang sau
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
