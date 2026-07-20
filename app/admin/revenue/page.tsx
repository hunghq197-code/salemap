import { Banknote, CalendarClock, CircleDollarSign, UsersRound } from "lucide-react";
import {
  markSubscriptionContactedAction,
  updateCancellationReviewAction,
} from "@/app/admin/revenue/actions";
import { AdminField } from "@/components/admin/AdminField";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { getAdminRevenue } from "@/lib/admin/data/revenue";
import type { AdminSearchParams } from "@/lib/admin/data/utils";
import { getParam } from "@/lib/admin/data/utils";

export const dynamic = "force-dynamic";

type AdminRevenuePageProps = {
  searchParams?: AdminSearchParams;
};

const inputClass =
  "mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("vi-VN") : "Chưa có";
}

function requestTypeLabel(value?: string | null) {
  const labels: Record<string, string> = {
    new_subscription: "Nâng cấp mới",
    plan_change: "Đổi gói",
    renewal: "Gia hạn",
  };

  return labels[value || "new_subscription"] || "Nâng cấp mới";
}

export default async function AdminRevenuePage(props: AdminRevenuePageProps) {
  const searchParams = await props.searchParams;
  const data = await getAdminRevenue(searchParams);
  const filterApplied = Boolean(
    getParam(searchParams, "fromDate") ||
      getParam(searchParams, "toDate") ||
      getParam(searchParams, "planKey") ||
      getParam(searchParams, "requestType"),
  );

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Theo dõi MRR, doanh thu chuyển khoản thủ công, gói sắp hết hạn và tín hiệu churn."
        title="Doanh thu"
      />

      {!data.schemaReady ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
          Chưa thấy bảng revenue/subscription lifecycle. Hãy chạy file SQL revenue-renewal-churn trong Supabase trước.
        </div>
      ) : null}

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard icon={<CircleDollarSign className="h-5 w-5" />} label="MRR hiện tại" value={formatCurrency(data.kpis.mrrVnd)} />
        <AdminKpiCard icon={<Banknote className="h-5 w-5" />} label="Doanh thu tháng này" value={formatCurrency(data.kpis.manualRevenueThisMonth)} />
        <AdminKpiCard icon={<UsersRound className="h-5 w-5" />} label="Active paid users" value={data.kpis.activePaidUsers} />
        <AdminKpiCard icon={<CalendarClock className="h-5 w-5" />} label="Sắp hết hạn 7 ngày" value={data.expiringSubscriptions.length} />
        <AdminKpiCard label="Pro users" value={data.kpis.activeProUsers} />
        <AdminKpiCard label="Pro Plus users" value={data.kpis.activeProPlusUsers} />
        <AdminKpiCard label="Cancellation tháng này" value={data.kpis.cancellationRequestsThisMonth} />
        <AdminKpiCard label="Renewal rate MVP" value={`${data.kpis.renewalRate}%`} />
      </section>

      <form className="mt-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm" method="get">
        <div className="grid gap-4 md:grid-cols-5">
          <AdminField label="Từ ngày">
            <input className={inputClass} defaultValue={getParam(searchParams, "fromDate") || ""} name="fromDate" type="date" />
          </AdminField>
          <AdminField label="Đến ngày">
            <input className={inputClass} defaultValue={getParam(searchParams, "toDate") || ""} name="toDate" type="date" />
          </AdminField>
          <AdminField label="Plan">
            <select className={inputClass} defaultValue={getParam(searchParams, "planKey") || ""} name="planKey">
              <option value="">Tất cả</option>
              <option value="pro">Pro</option>
              <option value="pro_plus">Pro Plus</option>
            </select>
          </AdminField>
          <AdminField label="Request type">
            <select className={inputClass} defaultValue={getParam(searchParams, "requestType") || ""} name="requestType">
              <option value="">Tất cả</option>
              <option value="new_subscription">Nâng cấp mới</option>
              <option value="renewal">Gia hạn</option>
              <option value="plan_change">Đổi gói</option>
            </select>
          </AdminField>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-5 py-2.5 text-sm font-bold text-white md:self-end"
            type="submit"
          >
            Lọc doanh thu
          </button>
        </div>
        {filterApplied ? (
          <p className="mt-3 text-xs font-semibold text-slate-500">Đang áp dụng filter.</p>
        ) : null}
      </form>

      <section className="mt-8">
        <h2 className="mb-4 text-xl font-bold text-ink">Revenue table</h2>
        <AdminTable
          empty={data.payments.length === 0}
          headers={["Ngày paid", "User", "Email", "Plan", "Amount", "Request type", "Reviewed by", "Payment request id"]}
        >
          {data.payments.map((payment) => (
            <tr key={payment.id}>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(payment.reviewed_at || payment.updated_at || payment.created_at)}</td>
              <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{payment.userLabel}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{payment.userEmail || "Chưa có"}</td>
              <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{payment.plan_name}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatCurrency(payment.amount_vnd)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{requestTypeLabel(payment.request_type)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{payment.reviewedByLabel || "Chưa có"}</td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">{payment.id}</td>
            </tr>
          ))}
        </AdminTable>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-xl font-bold text-ink">Subscriptions sắp hết hạn</h2>
        <AdminTable
          empty={data.expiringSubscriptions.length === 0}
          headers={["User", "Plan", "Period end", "Days remaining", "Reminder sent", "Action"]}
        >
          {data.expiringSubscriptions.map((subscription) => {
            const action = markSubscriptionContactedAction.bind(null, subscription.id || "");

            return (
              <tr key={subscription.id}>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{subscription.userLabel}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{subscription.plan_name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(subscription.current_period_end)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{subscription.daysRemaining ?? "Chưa có"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(subscription.renewal_reminder_sent_at)}</td>
                <td className="min-w-[260px] px-4 py-3">
                  <form action={action} className="flex gap-2">
                    <input className="min-h-9 w-40 rounded-lg border border-slate-200 px-2 py-1 text-xs" name="note" placeholder="Ghi chú liên hệ" />
                    <button className="min-h-9 rounded-lg bg-ink px-3 py-2 text-xs font-bold text-white" type="submit">
                      Mark contacted
                    </button>
                  </form>
                </td>
              </tr>
            );
          })}
        </AdminTable>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-xl font-bold text-ink">Cancellation requests</h2>
        <AdminTable
          empty={data.cancellations.length === 0}
          headers={["User", "Reason type", "Reason detail", "Would return if", "Status", "Created at", "Action"]}
        >
          {data.cancellations.map((item) => {
            const action = updateCancellationReviewAction.bind(null, item.id);

            return (
              <tr key={item.id}>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{item.userLabel}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{item.reason_type}</td>
                <td className="min-w-[220px] px-4 py-3 text-slate-600">{item.reason_detail || "Chưa có"}</td>
                <td className="min-w-[220px] px-4 py-3 text-slate-600">{item.would_return_if || "Chưa có"}</td>
                <td className="whitespace-nowrap px-4 py-3"><AdminStatusBadge value={item.status} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(item.created_at)}</td>
                <td className="min-w-[300px] px-4 py-3">
                  <form action={action} className="flex gap-2">
                    <select className="min-h-9 rounded-lg border border-slate-200 px-2 py-1 text-xs" defaultValue={item.status} name="status">
                      <option value="new">new</option>
                      <option value="reviewing">reviewing</option>
                      <option value="resolved">resolved</option>
                      <option value="retained">retained</option>
                      <option value="closed">closed</option>
                    </select>
                    <input className="min-h-9 w-40 rounded-lg border border-slate-200 px-2 py-1 text-xs" name="adminNote" placeholder="Admin note" />
                    <button className="min-h-9 rounded-lg bg-ink px-3 py-2 text-xs font-bold text-white" type="submit">
                      Update
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
