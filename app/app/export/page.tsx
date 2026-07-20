import { Download } from "lucide-react";
import { ExportLeadsForm } from "@/components/export/ExportLeadsForm";
import { FeatureDisabledNotice } from "@/components/ui/FeatureDisabledNotice";
import { countExportLeads, type ExportLeadFilters } from "@/lib/data/export";
import { isFeatureEnabled } from "@/lib/data/feature-flags";
import { getTags } from "@/lib/data/tags";
import { getDailyUsageSnapshot } from "@/lib/data/usage";

export const dynamic = "force-dynamic";

type ExportPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ExportPage(props: ExportPageProps) {
  const searchParams = await props.searchParams;
  const exportEnabled = await isFeatureEnabled("export_csv");
  const filters: ExportLeadFilters = {
    fromDate: getString(searchParams?.fromDate) || undefined,
    source: getString(searchParams?.source) || undefined,
    status: getString(searchParams?.status) || undefined,
    tagId: getString(searchParams?.tagId) || undefined,
    toDate: getString(searchParams?.toDate) || undefined,
  };

  const [tags, count, quota] = exportEnabled
    ? await Promise.all([
        getTags(),
        countExportLeads(filters),
        getDailyUsageSnapshot(["export_leads"]),
      ])
    : [[], 0, { items: [], schemaReady: true }];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-mint/15 text-ocean">
          <Download aria-hidden="true" className="h-6 w-6" />
        </span>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            Export
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Xuất dữ liệu lead
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
            Tải danh sách lead cá nhân của bạn ra file CSV để lưu trữ hoặc xử lý thêm.
          </p>
        </div>
      </div>

      {exportEnabled ? (
        <ExportLeadsForm
          count={count}
          exportQuota={quota.items[0] ?? null}
          filters={filters}
          quotaSchemaReady={quota.schemaReady}
          tags={tags}
        />
      ) : (
        <FeatureDisabledNotice flagKey="export_csv" />
      )}
    </div>
  );
}
