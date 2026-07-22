import {
  removeFeatureOverrideAction,
  removeQuotaOverrideAction,
  saveFeatureOverrideAction,
  saveQuotaOverrideAction,
} from "@/app/admin/quotas/actions";
import { AdminField } from "@/components/admin/AdminField";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminTable } from "@/components/admin/AdminTable";
import {
  FEATURE_OVERRIDE_FIELDS,
  QUOTA_OVERRIDE_FIELDS,
  getAdminQuotaOverrides,
} from "@/lib/admin/data/quotas";
import { getParam, type AdminSearchParams } from "@/lib/admin/data/utils";

export const dynamic = "force-dynamic";

type AdminQuotasPageProps = {
  searchParams?: AdminSearchParams;
};

const inputClass =
  "mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15";

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Theo gói";
  }

  if (typeof value === "boolean") {
    return value ? "Bật" : "Tắt";
  }

  return String(value);
}

export default async function AdminQuotasPage(props: AdminQuotasPageProps) {
  const searchParams = await props.searchParams;
  const data = await getAdminQuotaOverrides(searchParams);

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Quản lý quota và feature override ở cấp user. Thao tác cập nhật sẽ được ghi vào nhật ký quản trị."
        title="Quota & Feature overrides"
      />

      <div className="mt-6">
        <AdminFilterBar action="/admin/quotas" resetHref="/admin/quotas">
          <AdminField label="User">
            <input
              className={inputClass}
              defaultValue={getParam(searchParams, "q") || ""}
              name="q"
              placeholder="Email hoặc tên"
            />
          </AdminField>
          <AdminField label="Override">
            <select
              className={inputClass}
              defaultValue={getParam(searchParams, "onlyOverrides") || ""}
              name="onlyOverrides"
            >
              <option value="">Tất cả user</option>
              <option value="true">Chỉ user có override</option>
            </select>
          </AdminField>
        </AdminFilterBar>
      </div>

      <section className="grid gap-5 xl:grid-cols-2">
        <form action={saveQuotaOverrideAction} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-ink">Set quota override</h2>
          <AdminField label="User">
            <select className={inputClass} name="userId" required>
              <option value="">Chọn user</option>
              {data.result.items.map((row) => (
                <option key={row.userId} value={row.userId}>
                  {row.userLabel}
                </option>
              ))}
            </select>
          </AdminField>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {QUOTA_OVERRIDE_FIELDS.map((field) => (
              <AdminField key={field.key} label={field.label}>
                <input
                  className={inputClass}
                  min={0}
                  name={field.key}
                  placeholder="Trống = theo gói"
                  type="number"
                />
              </AdminField>
            ))}
          </div>
          <AdminField label="Lý do">
            <input className={inputClass} name="reason" placeholder="Ví dụ: beta customer, hỗ trợ demo" />
          </AdminField>
          <button className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-5 py-2.5 text-sm font-bold text-white" type="submit">
            Lưu quota override
          </button>
        </form>

        <form action={saveFeatureOverrideAction} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-ink">Set feature override</h2>
          <AdminField label="User">
            <select className={inputClass} name="userId" required>
              <option value="">Chọn user</option>
              {data.result.items.map((row) => (
                <option key={row.userId} value={row.userId}>
                  {row.userLabel}
                </option>
              ))}
            </select>
          </AdminField>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {FEATURE_OVERRIDE_FIELDS.map((field) => (
              <AdminField key={field.key} label={field.label}>
                <select className={inputClass} name={field.key}>
                  <option value="">Theo gói/global</option>
                  <option value="true">Bật</option>
                  <option value="false">Tắt</option>
                </select>
              </AdminField>
            ))}
          </div>
          <AdminField label="Lý do">
            <input className={inputClass} name="reason" placeholder="Ví dụ: chặn lạm dụng, mở beta" />
          </AdminField>
          <button className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-5 py-2.5 text-sm font-bold text-white" type="submit">
            Lưu feature override
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-bold text-ink">Quota mặc định theo gói</h2>
        <AdminTable headers={["Plan", "Action", "Quota"]}>
          {data.defaultQuotas.map((row) => (
            <tr key={`${row.planKey}:${row.actionType}`}>
              <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{row.planName}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{row.label}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{row.limit}</td>
            </tr>
          ))}
        </AdminTable>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-bold text-ink">User overrides</h2>
        <AdminTable
          empty={data.result.items.length === 0}
          headers={["User", "Quota override", "Feature override", "Actions"]}
        >
          {data.result.items.map((row) => {
            const removeQuota = removeQuotaOverrideAction.bind(null, row.userId);
            const removeFeature = removeFeatureOverrideAction.bind(null, row.userId);

            return (
              <tr key={row.userId}>
                <td className="min-w-64 px-4 py-3">
                  <p className="font-bold text-ink">{row.userLabel}</p>
                  <p className="text-xs text-slate-500">{row.email || "Chưa có email"}</p>
                </td>
                <td className="min-w-72 px-4 py-3 text-sm text-slate-700">
                  {row.quotaOverride ? (
                    <div className="space-y-1">
                      {QUOTA_OVERRIDE_FIELDS.map((field) => (
                        <p key={field.key}>
                          <strong>{field.label}:</strong>{" "}
                          {displayValue(row.quotaOverride?.[field.key])}
                        </p>
                      ))}
                      <p><strong>Lý do:</strong> {row.quotaOverride.reason || "Không có"}</p>
                    </div>
                  ) : (
                    "Theo gói"
                  )}
                </td>
                <td className="min-w-72 px-4 py-3 text-sm text-slate-700">
                  {row.featureOverride ? (
                    <div className="space-y-1">
                      {FEATURE_OVERRIDE_FIELDS.map((field) => (
                        <p key={field.key}>
                          <strong>{field.label}:</strong>{" "}
                          {displayValue(row.featureOverride?.[field.key])}
                        </p>
                      ))}
                      <p><strong>Lý do:</strong> {row.featureOverride.reason || "Không có"}</p>
                    </div>
                  ) : (
                    "Theo global/plan"
                  )}
                </td>
                <td className="min-w-56 px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <form action={removeQuota}>
                      <button className="min-h-9 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-ink hover:border-ocean" type="submit">
                        Xóa quota override
                      </button>
                    </form>
                    <form action={removeFeature}>
                      <button className="min-h-9 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-ink hover:border-ocean" type="submit">
                        Xóa feature override
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            );
          })}
        </AdminTable>
        <AdminPagination
          basePath="/admin/quotas"
          limit={data.result.limit}
          page={data.result.page}
          params={searchParams}
          totalPages={data.result.totalPages}
        />
      </section>
    </div>
  );
}
