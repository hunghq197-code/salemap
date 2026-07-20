import { HeartPulse, MessageSquareText, Search, TrendingDown, TrendingUp, UserCheck, UsersRound } from "lucide-react";
import { AdminField } from "@/components/admin/AdminField";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import {
  getUserHealthScores,
  HEALTH_LABEL_OPTIONS,
  RECOMMENDED_ACTION_OPTIONS,
} from "@/lib/data/user-health";
import { getParam, type AdminSearchParams } from "@/lib/admin/data/utils";

export const dynamic = "force-dynamic";

type AdminRetentionPageProps = {
  searchParams?: AdminSearchParams;
};

const inputClass =
  "mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15";

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString("vi-VN") : "Chưa có";
}

function UserMiniList({
  items,
  title,
}: {
  items: Array<{ health_score?: number | null; userLabel: string }>;
  title: string;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-bold text-ink">{title}</h2>
      {items.length > 0 ? (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2" key={`${title}-${item.userLabel}`}>
              <span className="truncate text-sm font-bold text-ink">{item.userLabel}</span>
              <span className="text-sm font-bold text-ocean">{item.health_score ?? 0}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-500">Chưa có dữ liệu.</p>
      )}
    </article>
  );
}

export default async function AdminRetentionPage(props: AdminRetentionPageProps) {
  const searchParams = await props.searchParams;
  const data = await getUserHealthScores(searchParams);

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Đo retention, core loop và health score của user để biết ai nên phỏng vấn hoặc follow-up."
        title="Retention"
      />

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard icon={<UserCheck className="h-5 w-5" />} label="Activated users" value={data.kpis.activatedUsers} />
        <AdminKpiCard icon={<HeartPulse className="h-5 w-5" />} label="Core loop completed" value={data.kpis.coreLoopUsers} />
        <AdminKpiCard icon={<UsersRound className="h-5 w-5" />} label="D1 active users" value={data.kpis.d1ActiveUsers} />
        <AdminKpiCard icon={<TrendingUp className="h-5 w-5" />} label="D7 retained users" value={data.kpis.d7RetainedUsers} />
        <AdminKpiCard icon={<TrendingUp className="h-5 w-5" />} label="High intent users" value={data.kpis.highIntentUsers} />
        <AdminKpiCard icon={<TrendingDown className="h-5 w-5" />} label="At-risk users" value={data.kpis.atRiskUsers} />
        <AdminKpiCard icon={<TrendingDown className="h-5 w-5" />} label="Inactive users" value={data.kpis.inactiveUsers} />
        <AdminKpiCard icon={<MessageSquareText className="h-5 w-5" />} label="Users with upgrade interest" value={data.kpis.usersWithUpgradeInterest} />
      </section>

      <section className="mt-8 grid gap-4 xl:grid-cols-5">
        <UserMiniList items={data.insights.highIntent} title="Top high-intent" />
        <UserMiniList items={data.insights.atRisk} title="Top at-risk" />
        <UserMiniList items={data.insights.routeNoSave} title="Route search chưa save" />
        <UserMiniList items={data.insights.leadNoReminder} title="Có lead chưa có reminder" />
        <UserMiniList items={data.insights.upgradeSignals} title="Chạm quota chưa upgrade" />
      </section>

      <div className="mt-8">
        <AdminFilterBar action="/admin/retention" resetHref="/admin/retention">
          <AdminField label="Health label">
            <select className={inputClass} defaultValue={getParam(searchParams, "healthLabel") || ""} name="healthLabel">
              <option value="">Tất cả</option>
              {HEALTH_LABEL_OPTIONS.map((label) => (
                <option key={label} value={label}>{label}</option>
              ))}
            </select>
          </AdminField>
          <AdminField label="Recommended action">
            <select className={inputClass} defaultValue={getParam(searchParams, "recommendedAction") || ""} name="recommendedAction">
              <option value="">Tất cả</option>
              {RECOMMENDED_ACTION_OPTIONS.map((action) => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </AdminField>
          <AdminField label="Role">
            <input className={inputClass} defaultValue={getParam(searchParams, "role") || ""} name="role" />
          </AdminField>
          <AdminField label="Industry">
            <input className={inputClass} defaultValue={getParam(searchParams, "industry") || ""} name="industry" />
          </AdminField>
          <AdminField label="Signals">
            <div className="mt-2 space-y-2 text-sm font-bold text-slate-600">
              <label className="flex items-center gap-2">
                <input defaultChecked={getParam(searchParams, "active7d") === "true"} name="active7d" type="checkbox" value="true" />
                Active 7 ngày
              </label>
              <label className="flex items-center gap-2">
                <input defaultChecked={getParam(searchParams, "coreLoop") === "true"} name="coreLoop" type="checkbox" value="true" />
                Core loop
              </label>
              <label className="flex items-center gap-2">
                <input defaultChecked={getParam(searchParams, "hasUpgrade") === "true"} name="hasUpgrade" type="checkbox" value="true" />
                Upgrade interest
              </label>
            </div>
          </AdminField>
        </AdminFilterBar>
      </div>

      <AdminTable
        empty={data.result.items.length === 0}
        headers={[
          "User",
          "Role",
          "Industry",
          "Score",
          "Label",
          "Last active",
          "Days 7d",
          "Leads",
          "Notes",
          "Reminders",
          "Searches",
          "Route",
          "Feedback",
          "Upgrade",
          "Action",
        ]}
      >
        {data.result.items.map((row) => (
          <tr key={row.user_id}>
            <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{row.userLabel}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.role_type || "Chưa có"}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.industry || "Chưa có"}</td>
            <td className="whitespace-nowrap px-4 py-3 font-bold text-ocean">{row.health_score ?? 0}</td>
            <td className="whitespace-nowrap px-4 py-3"><AdminStatusBadge value={row.health_label} /></td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(row.last_active_at)}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.days_active_7d ?? 0}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.leads_created_total ?? 0}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.notes_created_total ?? 0}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.reminders_created_total ?? 0}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.searches_total ?? 0}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.route_searches_total ?? 0}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.feedback_count ?? 0}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.upgrade_interest_count ?? 0}</td>
            <td className="whitespace-nowrap px-4 py-3"><AdminStatusBadge value={row.recommended_action} /></td>
          </tr>
        ))}
      </AdminTable>

      <AdminPagination
        basePath="/admin/retention"
        limit={data.result.limit}
        page={data.result.page}
        params={searchParams}
        totalPages={data.result.totalPages}
      />
    </div>
  );
}
