import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminTable } from "@/components/admin/AdminTable";
import { getAdminSalesAnalytics } from "@/lib/admin/data/sales-analytics";
import type { AdminSearchParams } from "@/lib/admin/data/utils";

export const dynamic = "force-dynamic";

type AdminSalesAnalyticsPageProps = {
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

export default async function AdminSalesAnalyticsPage(props: AdminSalesAnalyticsPageProps) {
  const searchParams = await props.searchParams;
  const { kpis, result } = await getAdminSalesAnalytics(searchParams);

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Theo dõi mức sử dụng và mục tiêu bán hàng ở dạng tổng hợp. Trang này không hiển thị dữ liệu định danh, số điện thoại, email, địa chỉ hoặc nội dung ghi chú của lead."
        title="Sales Analytics"
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        <AdminKpiCard label="Users with data" value={kpis.usersWithAnalyticsData} />
        <AdminKpiCard label="Goals created" value={kpis.goalsCreated} />
        <AdminKpiCard label="Active goals" value={kpis.activeGoals} />
        <AdminKpiCard label="Goals completed" value={kpis.goalsCompleted} />
        <AdminKpiCard label="Avg leads 30d" value={kpis.averageLeadsCreated30d} />
        <AdminKpiCard label="Avg follow-ups 30d" value={kpis.averageFollowupsCompleted30d} />
        <AdminKpiCard label="Pipeline today" value={kpis.pipelineStatusChangesToday} />
      </div>

      <AdminTable
        empty={result.items.length === 0}
        headers={[
          "User",
          "Goals",
          "Active",
          "Completed",
          "Leads 30d",
          "Follow-ups 30d",
          "Won 30d",
          "Last activity",
        ]}
      >
        {result.items.map((row) => (
          <tr key={row.userId}>
            <td className="max-w-[260px] truncate px-4 py-3 font-bold text-ink">
              {row.userLabel}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">{row.goalsCount}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">{row.activeGoals}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">{row.completedGoals}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">{row.leadsCreated30d}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
              {row.followupsCompleted30d}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">{row.wonLeads30d}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
              {formatDate(row.lastAnalyticsActivity)}
            </td>
          </tr>
        ))}
      </AdminTable>

      <AdminPagination
        basePath="/admin/sales-analytics"
        limit={result.limit}
        page={result.page}
        params={searchParams}
        totalPages={result.totalPages}
      />
    </div>
  );
}
