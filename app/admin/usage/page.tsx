import { AdminField } from "@/components/admin/AdminField";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { getAdminUsage } from "@/lib/admin/data/usage";
import { getParam, todayDate, type AdminSearchParams } from "@/lib/admin/data/utils";

export const dynamic = "force-dynamic";

type AdminUsagePageProps = {
  searchParams?: AdminSearchParams;
};

const inputClass =
  "mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15";

const actionOptions = [
  "near_me_search",
  "area_search",
  "route_search",
  "export_leads",
  "save_map_lead",
];

export default async function AdminUsagePage(props: AdminUsagePageProps) {
  const searchParams = await props.searchParams;
  const { kpis, result } = await getAdminUsage(searchParams);
  const selectedDate = getParam(searchParams, "date") || todayDate();

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Theo dõi lượt dùng theo ngày, action type và user đang chạm quota."
        title="Usage / quota"
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AdminKpiCard label="Near-me search" value={kpis.nearMeSearch} />
        <AdminKpiCard label="Area search" value={kpis.areaSearch} />
        <AdminKpiCard label="Route search" value={kpis.routeSearch} />
        <AdminKpiCard label="Export hôm nay" value={kpis.exportLeads} />
        <AdminKpiCard label="User chạm quota" value={kpis.quotaReachedUsers} />
      </div>

      <div className="mt-6">
        <AdminFilterBar action="/admin/usage" resetHref="/admin/usage">
          <AdminField label="Ngày">
            <input
              className={inputClass}
              defaultValue={selectedDate}
              name="date"
              type="date"
            />
          </AdminField>
          <AdminField label="Action type">
            <select
              className={inputClass}
              defaultValue={getParam(searchParams, "actionType") || ""}
              name="actionType"
            >
              <option value="">Tất cả</option>
              {actionOptions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label="Quota">
            <select
              className={inputClass}
              defaultValue={getParam(searchParams, "quotaReached") || ""}
              name="quotaReached"
            >
              <option value="">Tất cả</option>
              <option value="true">Chỉ user chạm quota</option>
            </select>
          </AdminField>
          <AdminField label="User search">
            <input
              className={inputClass}
              defaultValue={getParam(searchParams, "q") || ""}
              name="q"
              placeholder="Email hoặc tên"
            />
          </AdminField>
        </AdminFilterBar>
      </div>

      <AdminTable
        empty={result.items.length === 0}
        headers={[
          "User",
          "Ngày",
          "Near-me used",
          "Area used",
          "Route used",
          "Export used",
          "Save map lead used",
          "Quota",
        ]}
      >
        {result.items.map((row) => (
          <tr key={`${row.user_id}:${row.date}`}>
            <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">
              {row.userLabel}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.date}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
              {row.near_me_search}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
              {row.area_search}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
              {row.route_search}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
              {row.export_leads}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
              {row.save_map_lead}
            </td>
            <td className="whitespace-nowrap px-4 py-3">
              <AdminStatusBadge
                tone={row.quotaReached ? "yellow" : "green"}
                value={row.quotaReached ? "quota_reached" : "normal"}
              />
            </td>
          </tr>
        ))}
      </AdminTable>

      <AdminPagination
        basePath="/admin/usage"
        limit={result.limit}
        page={result.page}
        params={searchParams}
        totalPages={result.totalPages}
      />
    </div>
  );
}
