import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  downgradeSubscriptionAction,
  extendSubscriptionAction,
  grantTrialAction,
  markSubscriptionCancelledAction,
} from "@/app/admin/subscriptions/actions";
import { AdminConfirmSubmitButton } from "@/components/admin/AdminConfirmSubmitButton";
import { SubscriptionEventTimeline } from "@/components/admin/billing/SubscriptionEventTimeline";
import { AdminField } from "@/components/admin/AdminField";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { ADMIN_PERMISSIONS, hasPermission } from "@/lib/admin/admin-permissions";
import { getAdminContext } from "@/lib/admin/auth";
import { getAdminBillingPaymentsForSubscription } from "@/lib/admin/data/billing-payments";
import {
  getAdminSubscriptionById,
  getAdminSubscriptionEvents,
} from "@/lib/admin/data/subscriptions";
import { getPlanEntitlements } from "@/lib/billing/plans";

export const dynamic = "force-dynamic";

type AdminSubscriptionDetailPageProps = {
  params: Promise<{
    subscriptionId: string;
  }>;
};

const inputClass =
  "min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15";

function formatDate(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Chưa có";
}

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(Number(value ?? 0));
}

function normalizePlanId(value?: string | null) {
  return value === "pro" || value === "pro_plus" ? value : "free";
}

export default async function AdminSubscriptionDetailPage(
  props: AdminSubscriptionDetailPageProps,
) {
  const { subscriptionId } = await props.params;
  const [subscription, events, payments, admin] = await Promise.all([
    getAdminSubscriptionById(subscriptionId),
    getAdminSubscriptionEvents(subscriptionId),
    getAdminBillingPaymentsForSubscription(subscriptionId),
    getAdminContext(),
  ]);

  if (!subscription) {
    notFound();
  }

  const canUpdate = Boolean(
    admin && hasPermission(admin.role, ADMIN_PERMISSIONS.UPDATE_SUBSCRIPTION),
  );
  const extendAction = extendSubscriptionAction.bind(null, subscription.id || "");
  const downgradeAction = downgradeSubscriptionAction.bind(null, subscription.id || "");
  const cancelAction = markSubscriptionCancelledAction.bind(null, subscription.id || "");
  const trialAction = grantTrialAction.bind(null, subscription.id || "");
  const planId = normalizePlanId(subscription.plan_key);
  const entitlements = getPlanEntitlements(planId);

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        className="inline-flex items-center gap-2 text-sm font-bold text-ocean hover:text-ink"
        href="/admin/subscriptions"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Quay lại subscriptions
      </Link>

      <div className="mt-5">
        <AdminPageHeader
          description="Quản lý vòng đời subscription, entitlement và lịch sử payment liên quan. Mọi mutation phải có audit log."
          title={`Subscription ${subscription.plan_name}`}
        />
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard label="Plan" value={subscription.plan_name || subscription.plan_key} />
        <AdminKpiCard label="Status" value={subscription.status} />
        <AdminKpiCard label="Days remaining" value={subscription.daysRemaining ?? "n/a"} />
        <AdminKpiCard label="Provider" value={subscription.payment_method || "n/a"} />
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-[1fr_0.82fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ocean/10 text-ocean">
              <ShieldCheck aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-ink">Subscription summary</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                User, period, provider và trạng thái hiện tại.
              </p>
            </div>
          </div>

          <AdminTable empty={false} headers={["Field", "Value"]}>
            {[
              ["User", `${subscription.userLabel} · ${subscription.userEmail || "no email"}`],
              ["User id", subscription.user_id],
              ["Subscription id", subscription.id],
              ["Plan key", subscription.plan_key],
              ["Status", subscription.status],
              ["Period start", formatDate(subscription.current_period_start)],
              ["Period end", formatDate(subscription.current_period_end)],
              ["Trial ends", formatDate(subscription.trial_ends_at)],
              ["Grace ends", formatDate(subscription.grace_ends_at || subscription.grace_period_end)],
              ["Payment method", subscription.payment_method || "Chưa có"],
              ["Latest payment", subscription.latest_payment_request_id || "Chưa có"],
              ["Cancelled at", formatDate(subscription.cancelled_at)],
            ].map(([label, value]) => (
              <tr key={String(label)}>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{label}</td>
                <td className="break-all px-4 py-3 text-slate-700">{String(value)}</td>
              </tr>
            ))}
          </AdminTable>
        </article>

        <aside className="space-y-5">
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-ink">Entitlements</h2>
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              {Object.entries(entitlements).map(([key, value]) => (
                <div className="rounded-lg bg-slate-50 px-3 py-2" key={key}>
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">{key}</p>
                  <p className="mt-1 font-bold text-ink">{value.toLocaleString("vi-VN")}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-ink">Admin actions</h2>
            {!canUpdate ? (
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
                Role hiện tại chỉ được xem subscription, không được mutate.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                <form action={extendAction} className="space-y-2">
                  <AdminField label="Ghi chú extend">
                    <input className={inputClass} name="note" placeholder="Gia hạn theo đối soát" />
                  </AdminField>
                  <AdminConfirmSubmitButton
                    className="min-h-10 w-full text-sm"
                    confirmMessage="Xac nhan extend subscription nay them 1 thang?"
                    icon="check"
                    label="Extend 1 thang"
                    variant="success"
                  />
                </form>
                <form action={trialAction} className="grid gap-2 sm:grid-cols-[0.6fr_1fr]">
                  <input className={inputClass} name="days" placeholder="14" />
                  <select className={inputClass} defaultValue="pro" name="planId">
                    <option value="pro">Pro</option>
                    <option value="pro_plus">Pro Plus</option>
                  </select>
                  <AdminConfirmSubmitButton
                    className="min-h-10 w-full text-sm sm:col-span-2"
                    confirmMessage="Grant trial cho subscription nay?"
                    icon="shield"
                    label="Grant trial"
                    variant="neutral"
                  />
                </form>
                <form action={downgradeAction} className="space-y-2">
                  <input className={inputClass} name="reason" placeholder="Lý do downgrade" />
                  <AdminConfirmSubmitButton
                    className="min-h-10 w-full text-sm"
                    confirmMessage="Downgrade subscription nay ve Free?"
                    icon="warning"
                    label="Downgrade Free"
                    variant="warning"
                  />
                </form>
                <form action={cancelAction} className="space-y-2">
                  <input className={inputClass} name="note" placeholder="Ghi chú cancel" />
                  <AdminConfirmSubmitButton
                    className="min-h-10 w-full text-sm"
                    confirmMessage="Mark subscription nay la cancelled?"
                    icon="x"
                    label="Mark cancelled"
                    variant="danger"
                  />
                </form>
              </div>
            )}
          </article>
        </aside>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-ink">Linked payments</h2>
          <AdminStatusBadge value={`${payments.length} payments`} />
        </div>
        <AdminTable
          empty={payments.length === 0}
          headers={["Created", "Order", "Provider", "Amount", "Status", "Detail"]}
        >
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(payment.created_at)}</td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-bold text-ink">{payment.order_code}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{payment.provider}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatCurrency(payment.amount)}</td>
              <td className="whitespace-nowrap px-4 py-3"><AdminStatusBadge value={payment.status} /></td>
              <td className="whitespace-nowrap px-4 py-3">
                <Link className="inline-flex items-center gap-2 text-sm font-bold text-ocean hover:text-ink" href={`/admin/payments/${payment.id}`}>
                  Mở
                  <ExternalLink aria-hidden="true" className="h-4 w-4" />
                </Link>
              </td>
            </tr>
          ))}
        </AdminTable>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-ink">Subscription events</h2>
          <AdminStatusBadge value={`${events.length} events`} />
        </div>
        <SubscriptionEventTimeline events={events} />
      </section>
    </div>
  );
}
