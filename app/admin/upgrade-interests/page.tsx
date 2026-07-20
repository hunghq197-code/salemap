import { AdminField } from "@/components/admin/AdminField";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminInlineUpdateForm } from "@/components/admin/AdminInlineUpdateForm";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPageTracker } from "@/components/admin/AdminPageTracker";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import {
  getAdminUpgradeInterests,
  UPGRADE_INTEREST_STATUS_OPTIONS,
} from "@/lib/admin/data/upgrade-interests";
import { getParam, type AdminSearchParams } from "@/lib/admin/data/utils";

export const dynamic = "force-dynamic";

type AdminUpgradeInterestsPageProps = {
  searchParams?: AdminSearchParams;
};

const inputClass =
  "mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15";

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString("vi-VN") : "Chưa có";
}

function preview(value?: string | null, length = 120) {
  if (!value) {
    return "Chưa có";
  }

  return value.length > length ? `${value.slice(0, length)}...` : value;
}

export default async function AdminUpgradeInterestsPage(props: AdminUpgradeInterestsPageProps) {
  const searchParams = await props.searchParams;
  const { insights, result } = await getAdminUpgradeInterests(searchParams);
  const filterApplied = Boolean(
    getParam(searchParams, "plan") ||
      getParam(searchParams, "expectedPrice") ||
      getParam(searchParams, "mainFeature") ||
      getParam(searchParams, "role") ||
      getParam(searchParams, "industry") ||
      getParam(searchParams, "status") ||
      getParam(searchParams, "fromDate") ||
      getParam(searchParams, "toDate"),
  );

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageTracker filterApplied={filterApplied} page="upgrade_interests" />
      <AdminPageHeader
        description="Theo dõi tín hiệu nâng cấp, lý do muốn trả phí và cập nhật trạng thái follow-up."
        title="Quan tâm nâng cấp"
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard label="Quan tâm Pro" value={insights.pro} />
        <AdminKpiCard label="Quan tâm Pro Plus" value={insights.proPlus} />
        <AdminKpiCard label="Giá được chọn nhiều nhất" value={insights.mostCommonPrice} />
        <AdminKpiCard
          label="Tính năng được quan tâm nhất"
          value={insights.mostCommonFeature}
        />
      </div>

      <div className="mt-6">
        <AdminFilterBar
          action="/admin/upgrade-interests"
          resetHref="/admin/upgrade-interests"
        >
          <AdminField label="Plan">
            <input
              className={inputClass}
              defaultValue={getParam(searchParams, "plan") || ""}
              name="plan"
              placeholder="pro, pro_plus"
            />
          </AdminField>
          <AdminField label="Expected price">
            <input
              className={inputClass}
              defaultValue={getParam(searchParams, "expectedPrice") || ""}
              name="expectedPrice"
            />
          </AdminField>
          <AdminField label="Main feature">
            <input
              className={inputClass}
              defaultValue={getParam(searchParams, "mainFeature") || ""}
              name="mainFeature"
            />
          </AdminField>
          <AdminField label="Vai trò">
            <input
              className={inputClass}
              defaultValue={getParam(searchParams, "role") || ""}
              name="role"
            />
          </AdminField>
          <AdminField label="Ngành">
            <input
              className={inputClass}
              defaultValue={getParam(searchParams, "industry") || ""}
              name="industry"
            />
          </AdminField>
          <AdminField label="Status">
            <select
              className={inputClass}
              defaultValue={getParam(searchParams, "status") || ""}
              name="status"
            >
              <option value="">Tất cả</option>
              {UPGRADE_INTEREST_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label="Từ ngày">
            <input
              className={inputClass}
              defaultValue={getParam(searchParams, "fromDate") || ""}
              name="fromDate"
              type="date"
            />
          </AdminField>
          <AdminField label="Đến ngày">
            <input
              className={inputClass}
              defaultValue={getParam(searchParams, "toDate") || ""}
              name="toDate"
              type="date"
            />
          </AdminField>
        </AdminFilterBar>
      </div>

      <AdminTable
        empty={result.items.length === 0}
        headers={[
          "Ngày gửi",
          "User",
          "Plan",
          "Reason preview",
          "Expected price",
          "Main feature",
          "Role",
          "Industry",
          "Status",
          "Source page",
          "Chi tiết / cập nhật",
        ]}
      >
        {result.items.map((interest) => (
          <tr key={interest.id}>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">
              {formatDate(interest.created_at)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">
              {interest.userLabel}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
              {interest.plan_name || interest.plan_key || "Chưa có"}
            </td>
            <td className="min-w-[260px] px-4 py-3 text-slate-600">
              {preview(interest.reason)}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">
              {interest.expected_price || "Chưa có"}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">
              {interest.main_feature_interest || "Chưa có"}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">
              {interest.current_role_type || "Chưa có"}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">
              {interest.industry || "Chưa có"}
            </td>
            <td className="whitespace-nowrap px-4 py-3">
              <AdminStatusBadge value={interest.status} />
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">
              {interest.source_page || "Chưa có"}
            </td>
            <td className="px-4 py-3">
              <details className="min-w-[320px]">
                <summary className="cursor-pointer text-sm font-bold text-ocean">
                  Mở chi tiết
                </summary>
                <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                  <p className="font-bold text-ink">Reason</p>
                  <p className="mt-2 whitespace-pre-wrap">
                    {interest.reason || "Chưa có"}
                  </p>
                  <p className="mt-3 font-bold text-ink">Thông tin gói</p>
                  <p className="mt-1">
                    {interest.plan_key || "Chưa có"} -{" "}
                    {interest.expected_price || "Chưa có mức giá"}
                  </p>
                </div>
                <div className="mt-3">
                  <AdminInlineUpdateForm
                    adminNote={interest.admin_note}
                    endpoint={`/api/admin/upgrade-interests/${interest.id}`}
                    eventType="upgrade_interest"
                    fields={[
                      {
                        defaultValue: interest.status,
                        label: "Status",
                        name: "status",
                        options: [...UPGRADE_INTEREST_STATUS_OPTIONS],
                      },
                    ]}
                    planKey={interest.plan_key}
                  />
                </div>
              </details>
            </td>
          </tr>
        ))}
      </AdminTable>

      <AdminPagination
        basePath="/admin/upgrade-interests"
        limit={result.limit}
        page={result.page}
        params={searchParams}
        totalPages={result.totalPages}
      />
    </div>
  );
}
