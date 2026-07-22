import Link from "next/link";
import {
  downgradeSubscriptionAction,
  extendSubscriptionAction,
  grantTrialAction,
  markSubscriptionCancelledAction,
} from "@/app/admin/subscriptions/actions";
import { AdminField } from "@/components/admin/AdminField";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { getAdminSubscriptions } from "@/lib/admin/data/subscriptions";
import type { AdminSearchParams } from "@/lib/admin/data/utils";
import { getParam } from "@/lib/admin/data/utils";
import { getSubscriptionEventsForUser } from "@/lib/data/subscription-events";

export const dynamic = "force-dynamic";

type AdminSubscriptionsPageProps = {
  searchParams?: AdminSearchParams;
};

const inputClass =
  "mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15";

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("vi-VN") : "Chưa có";
}

export default async function AdminSubscriptionsPage(props: AdminSubscriptionsPageProps) {
  const searchParams = await props.searchParams;
  const data = await getAdminSubscriptions(searchParams);
  const selectedUserId = getParam(searchParams, "selectedUser") || "";
  const events = selectedUserId
    ? await getSubscriptionEventsForUser(selectedUserId)
    : [];

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Quản lý vòng đời subscription thủ công: extend, downgrade, cancel và xem lịch sử sự kiện."
        title="Subscriptions"
      />

      {!data.schemaReady ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
          Chưa thấy bảng subscriptions/subscription_events. Hãy chạy file SQL revenue-renewal-churn trong Supabase trước.
        </div>
      ) : null}

      <form className="mt-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm" method="get">
        <div className="grid gap-4 md:grid-cols-5">
          <AdminField label="Plan">
            <select className={inputClass} defaultValue={getParam(searchParams, "planKey") || ""} name="planKey">
              <option value="">Tất cả</option>
              <option value="free_beta">Free</option>
              <option value="pro">Pro</option>
              <option value="pro_plus">Pro Plus</option>
            </select>
          </AdminField>
          <AdminField label="Status">
            <select className={inputClass} defaultValue={getParam(searchParams, "status") || ""} name="status">
              <option value="">Tất cả</option>
              <option value="active">active</option>
              <option value="expired">expired</option>
              <option value="cancelled">cancelled</option>
              <option value="past_due">past_due</option>
            </select>
          </AdminField>
          <AdminField label="Sắp hết hạn">
            <select className={inputClass} defaultValue={getParam(searchParams, "expiringSoon") || ""} name="expiringSoon">
              <option value="">Tất cả</option>
              <option value="true">Trong 7 ngày</option>
            </select>
          </AdminField>
          <AdminField label="Cancel requested">
            <select className={inputClass} defaultValue={getParam(searchParams, "cancelledRequested") || ""} name="cancelledRequested">
              <option value="">Tất cả</option>
              <option value="true">Có yêu cầu</option>
            </select>
          </AdminField>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-5 py-2.5 text-sm font-bold text-white md:self-end"
            type="submit"
          >
            Lọc subscriptions
          </button>
        </div>
      </form>

      {selectedUserId ? (
        <section className="mt-8 rounded-lg border border-ocean/20 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-ink">Event history</h2>
            <Link className="text-sm font-bold text-ocean" href="/admin/subscriptions">
              Đóng
            </Link>
          </div>
          {events.length > 0 ? (
            <div className="mt-4 space-y-3">
              {events.map((event) => (
                <div className="rounded-lg bg-slate-50 px-4 py-3" key={event.id}>
                  <p className="font-bold text-ink">{event.event_type}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {formatDate(event.created_at)} · {event.from_plan_key || "-"} → {event.to_plan_key || "-"} ·{" "}
                    {event.note || "Không có ghi chú"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
              Chưa có event nào.
            </p>
          )}
        </section>
      ) : null}

      <section className="mt-8">
        <AdminTable
          empty={data.items.length === 0}
          headers={[
            "User",
            "Plan",
            "Status",
            "Period start",
            "Period end",
            "Days remaining",
            "Activated at",
            "Cancelled requested",
            "Latest payment request",
            "Actions",
          ]}
        >
          {data.items.map((subscription) => {
            const extendAction = extendSubscriptionAction.bind(null, subscription.id || "");
            const downgradeAction = downgradeSubscriptionAction.bind(null, subscription.id || "");
            const cancelAction = markSubscriptionCancelledAction.bind(null, subscription.id || "");
            const trialAction = grantTrialAction.bind(null, subscription.id || "");

            return (
              <tr key={subscription.id || subscription.user_id}>
                <td className="whitespace-nowrap px-4 py-3">
                  <p className="font-bold text-ink">{subscription.userLabel}</p>
                  <p className="text-xs text-slate-500">{subscription.userEmail || "Chưa có email"}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{subscription.plan_name}</td>
                <td className="whitespace-nowrap px-4 py-3"><AdminStatusBadge value={subscription.status} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(subscription.current_period_start)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(subscription.current_period_end)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{subscription.daysRemaining ?? "Chưa có"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(subscription.activated_at)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(subscription.cancelled_by_user_at)}</td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">{subscription.latest_payment_request_id || "Chưa có"}</td>
                <td className="min-w-[360px] px-4 py-3">
                  <div className="space-y-2">
                    <form action={extendAction} className="flex gap-2">
                      <input className="min-h-9 w-40 rounded-lg border border-slate-200 px-2 py-1 text-xs" name="note" placeholder="Ghi chú extend" />
                      <button className="min-h-9 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white" type="submit">
                        Extend 1 tháng
                      </button>
                    </form>
                    <form action={downgradeAction} className="flex gap-2">
                      <input className="min-h-9 w-40 rounded-lg border border-slate-200 px-2 py-1 text-xs" name="reason" placeholder="Lý do downgrade" />
                      <button className="min-h-9 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white" type="submit">
                        Downgrade Free
                      </button>
                    </form>
                    <form action={trialAction} className="flex gap-2">
                      <input className="min-h-9 w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs" name="days" placeholder="14" />
                      <select className="min-h-9 rounded-lg border border-slate-200 px-2 py-1 text-xs" name="planId" defaultValue="pro">
                        <option value="pro">Pro</option>
                        <option value="pro_plus">Pro Plus</option>
                      </select>
                      <button className="min-h-9 rounded-lg bg-ocean px-3 py-2 text-xs font-bold text-white" type="submit">
                        Grant trial
                      </button>
                    </form>
                    <form action={cancelAction} className="flex gap-2">
                      <input className="min-h-9 w-40 rounded-lg border border-slate-200 px-2 py-1 text-xs" name="note" placeholder="Ghi chú cancel" />
                      <button className="min-h-9 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white" type="submit">
                        Mark cancelled
                      </button>
                    </form>
                    <Link
                      className="inline-flex min-h-9 items-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-ink hover:border-ocean"
                      href={`/admin/subscriptions?selectedUser=${subscription.user_id}`}
                    >
                      View events
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </AdminTable>
      </section>
    </div>
  );
}
