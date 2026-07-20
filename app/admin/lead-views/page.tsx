import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminTable } from "@/components/admin/AdminTable";
import { getAdminLeadViews } from "@/lib/admin/data/lead-views";
import type { AdminSearchParams } from "@/lib/admin/data/utils";

export const dynamic = "force-dynamic";

type AdminLeadViewsPageProps = {
  searchParams?: AdminSearchParams;
};

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export default async function AdminLeadViewsPage(props: AdminLeadViewsPageProps) {
  const searchParams = await props.searchParams;
  const { kpis, result } = await getAdminLeadViews(searchParams);

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Theo doi pipeline usage, saved views va smart view usage. Trang nay khong hien thi raw lead PII."
        title="Lead Views"
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <AdminKpiCard label="Users using pipeline" value={kpis.usersUsingPipeline} />
        <AdminKpiCard label="Status changes today" value={kpis.pipelineStatusChangesToday} />
        <AdminKpiCard label="Saved views" value={kpis.savedViewsCreated} />
        <AdminKpiCard label="Pinned views" value={kpis.pinnedViews} />
        <AdminKpiCard label="Most used smart view" value={kpis.mostUsedSmartView} />
        <AdminKpiCard label="Advanced filters" value={kpis.advancedFilterUsage} />
      </div>

      <AdminTable
        empty={result.items.length === 0}
        headers={[
          "User",
          "Saved views",
          "Pinned views",
          "Pipeline events",
          "Last pipeline activity",
          "Last saved view activity",
        ]}
      >
        {result.items.map((row) => (
          <tr key={row.userId}>
            <td className="max-w-[260px] truncate px-4 py-3 font-bold text-ink">
              {row.userLabel}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
              {row.savedViewsCount}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
              {row.pinnedViewsCount}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
              {row.pipelineEventsCount}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
              {formatDate(row.lastPipelineActivity)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
              {formatDate(row.lastSavedViewActivity)}
            </td>
          </tr>
        ))}
      </AdminTable>

      <AdminPagination
        basePath="/admin/lead-views"
        limit={result.limit}
        page={result.page}
        params={searchParams}
        totalPages={result.totalPages}
      />
    </div>
  );
}
