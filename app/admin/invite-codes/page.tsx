import { Plus, Ticket } from "lucide-react";
import {
  createInviteCodeAction,
  toggleInviteCodeAction,
} from "@/app/admin/invite-codes/actions";
import { AdminCopyButton } from "@/components/admin/AdminCopyButton";
import { AdminField } from "@/components/admin/AdminField";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { listAdminInviteCodes } from "@/lib/admin/data/invite-codes";

export const dynamic = "force-dynamic";

type AdminInviteCodesPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const inputClass =
  "mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15";

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString("vi-VN") : "Chưa có";
}

function isExpired(value?: string | null) {
  return value ? new Date(value).getTime() < Date.now() : false;
}

export default async function AdminInviteCodesPage(props: AdminInviteCodesPageProps) {
  const searchParams = await props.searchParams;
  const data = await listAdminInviteCodes();
  const activeFilter = getString(searchParams?.active) || "";
  const sourceFilter = getString(searchParams?.source) || "";
  const cohortFilter = getString(searchParams?.cohortId) || "";
  const expiredFilter = getString(searchParams?.expired) || "";
  const filteredItems = data.items.filter((item) => {
    if (activeFilter === "true" && !item.is_active) return false;
    if (activeFilter === "false" && item.is_active) return false;
    if (sourceFilter && item.source !== sourceFilter) return false;
    if (cohortFilter && item.cohort_id !== cohortFilter) return false;
    if (expiredFilter === "true" && !isExpired(item.expires_at)) return false;
    if (expiredFilter === "false" && isExpired(item.expires_at)) return false;

    return true;
  });
  const sources = Array.from(
    new Set(data.items.map((item) => item.source).filter(Boolean) as string[]),
  );

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Tạo và kiểm soát mã mời để mở đăng ký theo từng nhóm user."
        title="Invite Codes"
      />

      {!data.schemaReady ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
          Chưa thấy bảng invite code. Hãy chạy file SQL public-beta-readiness trong Supabase trước.
        </div>
      ) : null}

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <AdminKpiCard
          icon={<Ticket className="h-5 w-5" />}
          label="Tổng mã"
          value={data.items.length}
        />
        <AdminKpiCard
          label="Đang active"
          value={data.items.filter((item) => item.is_active).length}
        />
        <AdminKpiCard
          label="Đã redeem"
          value={data.items.reduce((total, item) => total + Number(item.used_count ?? 0), 0)}
        />
      </section>

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-ink">Tạo mã mời</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Để trống ô Code nếu muốn SaleMap tự sinh mã theo format SALEMAP-INVITE-XXXX.
        </p>
        <form action={createInviteCodeAction} className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminField label="Code">
            <input className={inputClass} name="code" placeholder="SALEMAP-INVITE-001" />
          </AdminField>
          <AdminField label="Label">
            <input className={inputClass} name="label" placeholder="Launch cohort" />
          </AdminField>
          <AdminField label="Source">
            <input className={inputClass} name="source" placeholder="founder_network" />
          </AdminField>
          <AdminField label="Max uses">
            <input className={inputClass} defaultValue="1" min="1" name="maxUses" type="number" />
          </AdminField>
          <AdminField label="Assigned email">
            <input className={inputClass} name="assignedEmail" placeholder="optional@email.com" type="email" />
          </AdminField>
          <AdminField label="Assigned phone">
            <input className={inputClass} name="assignedPhone" placeholder="Optional" />
          </AdminField>
          <AdminField label="Cohort">
            <select className={inputClass} name="cohortId">
              <option value="">Không gắn cohort</option>
              {data.cohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.name}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label="Expires at">
            <input className={inputClass} name="expiresAt" type="datetime-local" />
          </AdminField>
          <AdminField label="Description">
            <input className={inputClass} name="description" placeholder="Ghi chú nội bộ" />
          </AdminField>
          <label className="mt-7 flex min-h-11 items-center gap-2 text-sm font-bold text-ink">
            <input defaultChecked name="isActive" type="checkbox" value="true" />
            Active
          </label>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-sm font-bold text-white md:col-span-2 xl:col-span-4"
            type="submit"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Tạo mã mời
          </button>
        </form>
      </section>

      <form className="mt-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm" method="get">
        <div className="grid gap-4 md:grid-cols-4">
          <AdminField label="Active">
            <select className={inputClass} defaultValue={activeFilter} name="active">
              <option value="">Tất cả</option>
              <option value="true">Active</option>
              <option value="false">Disabled</option>
            </select>
          </AdminField>
          <AdminField label="Source">
            <select className={inputClass} defaultValue={sourceFilter} name="source">
              <option value="">Tất cả</option>
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label="Cohort">
            <select className={inputClass} defaultValue={cohortFilter} name="cohortId">
              <option value="">Tất cả</option>
              {data.cohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.name}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label="Expiry">
            <select className={inputClass} defaultValue={expiredFilter} name="expired">
              <option value="">Tất cả</option>
              <option value="false">Chưa hết hạn</option>
              <option value="true">Đã hết hạn</option>
            </select>
          </AdminField>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-5 py-2.5 text-sm font-bold text-white md:col-span-4"
            type="submit"
          >
            Lọc invite code
          </button>
        </div>
      </form>

      <section className="mt-8">
        <AdminTable
          empty={filteredItems.length === 0}
          headers={[
            "Code",
            "Label",
            "Source",
            "Cohort",
            "Used / Max",
            "Active",
            "Expires at",
            "Created at",
            "Actions",
          ]}
        >
          {filteredItems.map((invite) => {
            const toggleAction = toggleInviteCodeAction.bind(
              null,
              invite.id,
              !invite.is_active,
            );

            return (
              <tr key={invite.id}>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-ink">{invite.code}</span>
                    <AdminCopyButton value={invite.code} />
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {invite.label || "Chưa có"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {invite.source || "Chưa có"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {invite.cohortName || "Không gắn"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">
                  {invite.used_count ?? 0}/{invite.max_uses ?? 1}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <AdminStatusBadge
                    tone={invite.is_active ? "green" : "red"}
                    value={invite.is_active ? "active" : "disabled"}
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {formatDate(invite.expires_at)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {formatDate(invite.created_at)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <form action={toggleAction}>
                    <button
                      className="inline-flex min-h-9 items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-ink hover:border-ocean"
                      type="submit"
                    >
                      {invite.is_active ? "Disable" : "Enable"}
                    </button>
                  </form>
                </td>
              </tr>
            );
          })}
        </AdminTable>
      </section>
    </div>
  );
}
