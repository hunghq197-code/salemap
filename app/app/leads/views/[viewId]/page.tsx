import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { BulkActionsForm } from "@/components/cleanup/BulkActionsForm";
import { LeadCard } from "@/components/leads/LeadCard";
import { SavedViewActions } from "@/components/saved-views/SavedViewActions";
import { getLeadFilterSummary } from "@/lib/leads/lead-filters";
import { getLeadsForSavedView } from "@/lib/data/lead-saved-views";
import { getTags } from "@/lib/data/tags";

export const dynamic = "force-dynamic";

type SavedViewDetailPageProps = {
  params: Promise<{
    viewId: string;
  }>;
  searchParams?: Record<string, string | string[] | undefined>;
};

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SavedViewDetailPage(props: SavedViewDetailPageProps) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const page = Number(getString(searchParams?.page) || 1);
  const [viewData, tags] = await Promise.all([
    getLeadsForSavedView(params.viewId, { limit: 20, page }),
    getTags(),
  ]);

  if (!viewData) {
    return (
      <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-ink">Khong tim thay goc nhin lead</h1>
        <Link
          className="mt-5 inline-flex min-h-12 items-center rounded-lg bg-mint px-5 py-3 text-sm font-bold text-ink"
          href="/app/leads/views"
        >
          Quay lai goc nhin lead
        </Link>
      </div>
    );
  }

  const { result, view } = viewData;
  const filterSummary = getLeadFilterSummary(view.filters);

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-ocean hover:text-ink"
        href="/app/leads/views"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Ve goc nhin lead
      </Link>

      <section className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
              {view.view_type === "custom" ? "Custom view" : "Smart view"}
            </p>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">
              {view.name}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
              {view.description || "Danh sach lead theo bo loc da luu."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {filterSummary.map((item) => (
                <span
                  className="inline-flex min-h-8 items-center rounded-full bg-cloud px-3 py-1 text-xs font-bold text-slate-600"
                  key={item}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink hover:border-ocean"
              href="/app/export"
            >
              <Download aria-hidden="true" className="h-4 w-4" />
              Xuat CSV
            </Link>
            <SavedViewActions
              isPinned={view.is_pinned}
              isSystem={view.is_system}
              viewId={view.id}
            />
          </div>
        </div>
      </section>

      <div className="mt-5 flex flex-col gap-2 text-sm font-semibold text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Hien thi {result.items.length} / {result.total} lead
        </p>
        <p>
          Trang {result.page} / {result.totalPages}
        </p>
      </div>

      {result.items.length > 0 ? (
        <BulkActionsForm currentPageLeadIds={result.items.map((lead) => lead.id)} tags={tags}>
          <div className="space-y-4">
            {result.items.map((lead) => (
              <LeadCard key={lead.id} lead={lead} selectable />
            ))}
          </div>
        </BulkActionsForm>
      ) : (
        <section className="mt-5 rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-ink">Chua co lead phu hop.</h2>
          <p className="mt-3 text-base leading-8 text-slate-600">
            Thu dieu chinh bo loc hoac them lead moi.
          </p>
        </section>
      )}
    </div>
  );
}
