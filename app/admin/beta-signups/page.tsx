import { AdminField } from "@/components/admin/AdminField";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminInlineUpdateForm } from "@/components/admin/AdminInlineUpdateForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import {
  BETA_CONTACT_STATUS_OPTIONS,
  getAdminBetaSignups,
} from "@/lib/admin/data/beta-signups";
import { getParam, type AdminSearchParams } from "@/lib/admin/data/utils";

export const dynamic = "force-dynamic";

type AdminBetaSignupsPageProps = {
  searchParams?: AdminSearchParams;
};

const inputClass =
  "mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15";

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString("vi-VN") : "Chưa có";
}

export default async function AdminBetaSignupsPage(props: AdminBetaSignupsPageProps) {
  const searchParams = await props.searchParams;
  const result = await getAdminBetaSignups(searchParams);

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Theo dõi lead đăng ký từ landing page và trạng thái liên hệ."
        title="Signups"
      />

      <div className="mt-6">
        <AdminFilterBar action="/admin/beta-signups" resetHref="/admin/beta-signups">
          <AdminField label="Persona">
            <input className={inputClass} defaultValue={getParam(searchParams, "persona") || ""} name="persona" />
          </AdminField>
          <AdminField label="Vai trò">
            <input className={inputClass} defaultValue={getParam(searchParams, "role") || ""} name="role" />
          </AdminField>
          <AdminField label="Ngành">
            <input className={inputClass} defaultValue={getParam(searchParams, "industry") || ""} name="industry" />
          </AdminField>
          <AdminField label="Contact status">
            <select className={inputClass} defaultValue={getParam(searchParams, "contactStatus") || ""} name="contactStatus">
              <option value="">Tất cả</option>
              {BETA_CONTACT_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label="Readiness">
            <input className={inputClass} defaultValue={getParam(searchParams, "betaReadiness") || ""} name="betaReadiness" />
          </AdminField>
          <AdminField label="UTM source">
            <input className={inputClass} defaultValue={getParam(searchParams, "utmSource") || ""} name="utmSource" />
          </AdminField>
          <AdminField label="Score min">
            <input className={inputClass} defaultValue={getParam(searchParams, "betaScoreMin") || ""} min="0" name="betaScoreMin" type="number" />
          </AdminField>
          <AdminField label="Từ ngày">
            <input className={inputClass} defaultValue={getParam(searchParams, "fromDate") || ""} name="fromDate" type="date" />
          </AdminField>
          <AdminField label="Đến ngày">
            <input className={inputClass} defaultValue={getParam(searchParams, "toDate") || ""} name="toDate" type="date" />
          </AdminField>
        </AdminFilterBar>
      </div>

      <AdminTable
        empty={result.items.length === 0}
        headers={[
          "Ngày đăng ký",
          "Họ tên",
          "SĐT/Zalo",
          "Email",
          "Vai trò",
          "Ngành",
          "Khu vực",
          "Tính năng quan tâm",
          "Readiness",
          "Score",
          "Persona",
          "Contact status",
          "UTM source",
          "UTM campaign",
          "Cập nhật",
        ]}
      >
        {result.items.map((signup) => (
          <tr key={signup.id}>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(signup.created_at)}</td>
            <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{signup.full_name}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{signup.phone_zalo}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{signup.email || "Chưa có"}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{signup.current_role}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{signup.industry}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{signup.main_area}</td>
            <td className="min-w-[220px] px-4 py-3 text-slate-600">
              {(signup.desired_features ?? []).join(", ") || "Chưa có"}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{signup.beta_readiness}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">{signup.beta_score ?? 0}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{signup.persona_label || "Chưa có"}</td>
            <td className="whitespace-nowrap px-4 py-3">
              <AdminStatusBadge value={signup.contact_status} />
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{signup.utm_source || "Chưa có"}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{signup.utm_campaign || "Chưa có"}</td>
            <td className="px-4 py-3">
              <AdminInlineUpdateForm
                adminNote={signup.admin_note}
                endpoint={`/api/admin/beta-signups/${signup.id}`}
                fields={[
                  {
                    defaultValue: signup.contact_status,
                    label: "Contact status",
                    name: "contactStatus",
                    options: [...BETA_CONTACT_STATUS_OPTIONS],
                  },
                ]}
              />
            </td>
          </tr>
        ))}
      </AdminTable>

      <AdminPagination
        basePath="/admin/beta-signups"
        limit={result.limit}
        page={result.page}
        params={searchParams}
        totalPages={result.totalPages}
      />
    </div>
  );
}
