import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminTable } from "@/components/admin/AdminTable";
import { getAdminDataQuality } from "@/lib/admin/data/data-quality";
import type { AdminSearchParams } from "@/lib/admin/data/utils";

export const dynamic = "force-dynamic";

type AdminDataQualityPageProps = {
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

export default async function AdminDataQualityPage(props: AdminDataQualityPageProps) {
  const searchParams = await props.searchParams;
  const { kpis, result } = await getAdminDataQuality(searchParams);

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Theo doi duplicate groups, data quality issues va bulk actions. Trang nay khong hien thi phone, email, dia chi hay raw note."
        title="Data Quality"
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <AdminKpiCard label="Duplicate groups" value={kpis.totalDuplicateGroups} />
        <AdminKpiCard label="Merged groups" value={kpis.duplicateGroupsMerged} />
        <AdminKpiCard label="Open issues" value={kpis.openDataQualityIssues} />
        <AdminKpiCard label="Bulk actions today" value={kpis.bulkActionsToday} />
        <AdminKpiCard label="Archived by bulk" value={kpis.leadsArchivedByBulkAction} />
        <AdminKpiCard label="Users using cleanup" value={kpis.usersUsingCleanup} />
      </div>

      <AdminTable
        empty={result.items.length === 0}
        headers={[
          "User",
          "Duplicate groups",
          "Merge completed",
          "Open issues",
          "Bulk actions",
          "Last cleanup activity",
        ]}
      >
        {result.items.map((row) => (
          <tr key={row.userId}>
            <td className="max-w-[260px] truncate px-4 py-3 font-bold text-ink">
              {row.userLabel}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
              {row.duplicateGroups}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
              {row.mergeCompleted}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
              {row.openIssues}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
              {row.bulkActions}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
              {formatDate(row.lastCleanupActivity)}
            </td>
          </tr>
        ))}
      </AdminTable>

      <AdminPagination
        basePath="/admin/data-quality"
        limit={result.limit}
        page={result.page}
        params={searchParams}
        totalPages={result.totalPages}
      />
    </div>
  );
}
