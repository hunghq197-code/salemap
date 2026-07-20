import { Plus, UsersRound } from "lucide-react";
import Link from "next/link";
import { createBetaCohortAction } from "@/app/admin/beta-cohorts/actions";
import { AdminField } from "@/components/admin/AdminField";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { COHORT_STATUS_OPTIONS, listBetaCohorts } from "@/lib/admin/data/beta-cohorts";

export const dynamic = "force-dynamic";

const inputClass =
  "mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15";

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("vi-VN") : "Chưa có";
}

export default async function AdminBetaCohortsPage() {
  const cohorts = await listBetaCohorts();

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Quản lý cohort, danh sách mời, phỏng vấn và ghi chú vận hành."
        title="Cohorts"
      />

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <AdminKpiCard icon={<UsersRound className="h-5 w-5" />} label="Tổng cohort" value={cohorts.length} />
        <AdminKpiCard label="Cohort active" value={cohorts.filter((cohort) => cohort.status === "active").length} />
        <AdminKpiCard label="Members" value={cohorts.reduce((total, cohort) => total + cohort.membersCount, 0)} />
      </section>

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-ink">Tạo cohort mới</h2>
        <form action={createBetaCohortAction} className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <AdminField label="Tên cohort">
            <input className={inputClass} name="name" placeholder="Launch cohort - Sale thị trường" required />
          </AdminField>
          <AdminField label="Cohort key">
            <input className={inputClass} name="cohortKey" placeholder="beta_round_2_field_sales" />
          </AdminField>
          <AdminField label="Target user count">
            <input className={inputClass} min="0" name="targetUserCount" type="number" />
          </AdminField>
          <AdminField label="Status">
            <select className={inputClass} name="status">
              {COHORT_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </AdminField>
          <AdminField label="Mô tả">
            <input className={inputClass} name="description" />
          </AdminField>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-sm font-bold text-white md:col-span-2 xl:col-span-5" type="submit">
            <Plus aria-hidden="true" className="h-4 w-4" />
            Tạo cohort mới
          </button>
        </form>
      </section>

      <section className="mt-8">
        <AdminTable
          empty={cohorts.length === 0}
          headers={["Tên cohort", "Status", "Target", "Members", "Started", "Completed", "Chi tiết"]}
        >
          {cohorts.map((cohort) => (
            <tr key={cohort.id}>
              <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{cohort.name}</td>
              <td className="whitespace-nowrap px-4 py-3"><AdminStatusBadge value={cohort.status} /></td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{cohort.target_user_count ?? 0}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{cohort.membersCount}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(cohort.started_at)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(cohort.ended_at)}</td>
              <td className="whitespace-nowrap px-4 py-3">
                <Link className="font-bold text-ocean hover:text-ink" href={`/admin/beta-cohorts/${cohort.id}`}>Mở cohort</Link>
              </td>
            </tr>
          ))}
        </AdminTable>
      </section>
    </div>
  );
}
