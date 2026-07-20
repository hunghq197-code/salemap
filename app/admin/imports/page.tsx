import { AdminField } from "@/components/admin/AdminField";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { getAdminImports } from "@/lib/admin/data/imports";
import { getParam, type AdminSearchParams } from "@/lib/admin/data/utils";

export const dynamic = "force-dynamic";

type AdminImportsPageProps = {
  searchParams?: AdminSearchParams;
};

const inputClass =
  "mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15";

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

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("vi-VN").format(Number(value ?? 0));
}

function statusTone(status: string) {
  if (status === "completed") return "green";
  if (status === "failed") return "red";
  if (status === "importing") return "yellow";
  return "slate";
}

export default async function AdminImportsPage(props: AdminImportsPageProps) {
  const searchParams = await props.searchParams;
  const { kpis, result } = await getAdminImports(searchParams);

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Theo dõi hoạt động import lead từ CSV/XLSX. Màn này không hiển thị raw row data mặc định để giảm rủi ro lộ dữ liệu khách."
        title="Imports"
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <AdminKpiCard label="Tổng jobs" value={kpis.totalJobs} />
        <AdminKpiCard label="Jobs hôm nay" value={kpis.jobsToday} />
        <AdminKpiCard label="Lead imported" value={kpis.totalImportedLeads} />
        <AdminKpiCard label="Import failed" value={kpis.failedJobs} />
        <AdminKpiCard label="User import nhiều" value={kpis.topImportUser} />
        <AdminKpiCard label="File lỗi nhiều" value={kpis.topErrorFile} />
      </div>

      <div className="mt-6">
        <AdminFilterBar action="/admin/imports" resetHref="/admin/imports">
          <AdminField label="Status">
            <select className={inputClass} defaultValue={getParam(searchParams, "status") || ""} name="status">
              <option value="">Tất cả</option>
              {["previewed", "mapped", "validated", "importing", "completed", "failed", "cancelled"].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label="File type">
            <select className={inputClass} defaultValue={getParam(searchParams, "fileType") || ""} name="fileType">
              <option value="">Tất cả</option>
              <option value="csv">CSV</option>
              <option value="xlsx">XLSX</option>
            </select>
          </AdminField>
          <AdminField label="Từ ngày">
            <input className={inputClass} defaultValue={getParam(searchParams, "dateFrom") || ""} name="dateFrom" type="date" />
          </AdminField>
          <AdminField label="Đến ngày">
            <input className={inputClass} defaultValue={getParam(searchParams, "dateTo") || ""} name="dateTo" type="date" />
          </AdminField>
          <AdminField label="User/File search">
            <input
              className={inputClass}
              defaultValue={getParam(searchParams, "q") || ""}
              name="q"
              placeholder="User id hoặc file name"
            />
          </AdminField>
        </AdminFilterBar>
      </div>

      <AdminTable
        empty={result.items.length === 0}
        headers={[
          "Ngày",
          "User",
          "File name",
          "Type",
          "Total",
          "Imported",
          "Invalid",
          "Duplicate",
          "Failed",
          "Status",
        ]}
      >
        {result.items.map((row) => (
          <tr key={row.id}>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">
              {formatDate(row.created_at)}
            </td>
            <td className="max-w-[220px] truncate px-4 py-3 font-bold text-ink">
              {row.userLabel}
            </td>
            <td className="max-w-[260px] truncate px-4 py-3 text-slate-700">
              {row.file_name}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">{row.file_type}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
              {formatNumber(row.total_rows)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
              {formatNumber(Number(row.imported_rows ?? 0) + Number(row.updated_rows ?? 0))}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
              {formatNumber(row.invalid_rows)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
              {formatNumber(row.duplicate_rows)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
              {formatNumber(row.failed_rows)}
            </td>
            <td className="whitespace-nowrap px-4 py-3">
              <AdminStatusBadge tone={statusTone(row.status)} value={row.status} />
            </td>
          </tr>
        ))}
      </AdminTable>

      <AdminPagination
        basePath="/admin/imports"
        limit={result.limit}
        page={result.page}
        params={searchParams}
        totalPages={result.totalPages}
      />
    </div>
  );
}
