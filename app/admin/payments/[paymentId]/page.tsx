import { ArrowLeft, ExternalLink, ReceiptText, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  cancelBillingPaymentAction,
  markBillingPaymentFailedAction,
  markBillingPaymentPaidAction,
} from "@/app/admin/payments/actions";
import { PaymentEventTimeline } from "@/components/admin/billing/PaymentEventTimeline";
import { AdminField } from "@/components/admin/AdminField";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { ADMIN_PERMISSIONS, hasPermission } from "@/lib/admin/admin-permissions";
import { getAdminContext } from "@/lib/admin/auth";
import {
  getAdminBillingPaymentById,
  getAdminPaymentEvents,
} from "@/lib/admin/data/billing-payments";

export const dynamic = "force-dynamic";

type AdminPaymentDetailPageProps = {
  params: Promise<{
    paymentId: string;
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

function planLabel(planId?: string | null) {
  return planId === "pro_plus" ? "Pro Plus" : planId === "pro" ? "Pro" : "Free";
}

function canMutateStatus(status: string) {
  return ["pending", "processing", "waiting_confirmation"].includes(status);
}

export default async function AdminPaymentDetailPage(props: AdminPaymentDetailPageProps) {
  const { paymentId } = await props.params;
  const [payment, events, admin] = await Promise.all([
    getAdminBillingPaymentById(paymentId),
    getAdminPaymentEvents(paymentId),
    getAdminContext(),
  ]);

  if (!payment) {
    notFound();
  }

  const canUpdate = Boolean(
    admin && hasPermission(admin.role, ADMIN_PERMISSIONS.UPDATE_PAYMENT_STATUS),
  );
  const canMutate = canUpdate && canMutateStatus(payment.status);
  const markPaidAction = markBillingPaymentPaidAction.bind(null, payment.id);
  const markFailedAction = markBillingPaymentFailedAction.bind(null, payment.id);
  const cancelAction = cancelBillingPaymentAction.bind(null, payment.id);

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        className="inline-flex items-center gap-2 text-sm font-bold text-ocean hover:text-ink"
        href="/admin/payments"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Quay lại payments
      </Link>

      <div className="mt-5">
        <AdminPageHeader
          description="Đối soát payment provider mới. Trang này không hiển thị secret, checksum, raw webhook payload hoặc provider payload thô."
          title={`Payment ${payment.order_code}`}
        />
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard label="Amount" value={formatCurrency(payment.amount)} />
        <AdminKpiCard label="Status" value={payment.status} />
        <AdminKpiCard label="Provider" value={payment.provider} />
        <AdminKpiCard label="Plan" value={planLabel(payment.plan_id)} />
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-[1fr_0.82fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ocean/10 text-ocean">
              <ReceiptText aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-ink">Payment summary</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Dữ liệu đối soát đã được lọc ở tầng server/admin data.
              </p>
            </div>
          </div>

          <AdminTable
            empty={false}
            headers={["Field", "Value"]}
          >
            {[
              ["User", `${payment.userLabel} · ${payment.userEmail || "no email"}`],
              ["Payment id", payment.id],
              ["Order code", payment.order_code],
              ["Payment code", payment.payment_code || "Chưa có"],
              ["Payment link id", payment.payment_link_id || "Chưa có"],
              ["Provider", payment.provider],
              ["Plan", planLabel(payment.plan_id)],
              ["Amount", formatCurrency(payment.amount)],
              ["Currency", payment.currency || "VND"],
              ["Status", payment.status],
              ["Created", formatDate(payment.created_at)],
              ["User confirmed", formatDate(payment.user_confirmed_transfer_at)],
              ["Paid at", formatDate(payment.paid_at)],
              ["Failed at", formatDate(payment.failed_at)],
              ["Cancelled at", formatDate(payment.cancelled_at)],
              ["Failure reason", payment.failure_reason || "Không có"],
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
            <h2 className="text-xl font-bold text-ink">Transfer details</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <p><strong>Bank:</strong> {payment.bank_name || "Chưa có"}</p>
              <p><strong>Account:</strong> {payment.bank_account_number || "Chưa có"}</p>
              <p><strong>Owner:</strong> {payment.bank_account_name || "Chưa có"}</p>
              <p className="break-all"><strong>Content:</strong> {payment.transfer_content || "Chưa có"}</p>
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-ink">Linked subscription</h2>
            {payment.subscription_id ? (
              <Link
                className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-ink hover:border-ocean"
                href={`/admin/subscriptions/${payment.subscription_id}`}
              >
                Mở subscription
                <ExternalLink aria-hidden="true" className="h-4 w-4" />
              </Link>
            ) : (
              <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
                Payment chưa liên kết subscription. Trạng thái paid hợp lệ sẽ tự gắn subscription.
              </p>
            )}
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldAlert aria-hidden="true" className="h-5 w-5 text-amber-600" />
              <h2 className="text-xl font-bold text-ink">Admin actions</h2>
            </div>
            {!canUpdate ? (
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
                Role hiện tại chỉ được xem payment, không được mark paid/failed/cancel.
              </p>
            ) : null}
            {canMutate ? (
              <div className="mt-4 space-y-3">
                <form action={markPaidAction} className="space-y-2">
                  <AdminField label="Ghi chú mark paid">
                    <input className={inputClass} name="adminNote" placeholder="Đã đối soát ngân hàng" />
                  </AdminField>
                  <button className="min-h-10 w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white" type="submit">
                    Mark paid
                  </button>
                </form>
                <div className="grid gap-2 sm:grid-cols-2">
                  <form action={markFailedAction}>
                    <button className="min-h-10 w-full rounded-lg bg-amber-600 px-3 py-2 text-sm font-bold text-white" type="submit">
                      Mark failed
                    </button>
                  </form>
                  <form action={cancelAction}>
                    <button className="min-h-10 w-full rounded-lg bg-rose-600 px-3 py-2 text-sm font-bold text-white" type="submit">
                      Cancel
                    </button>
                  </form>
                </div>
              </div>
            ) : canUpdate ? (
              <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
                Payment đang ở trạng thái cuối hoặc không thể mutate.
              </p>
            ) : null}
          </article>
        </aside>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-ink">Payment events</h2>
          <AdminStatusBadge value={`${events.length} events`} />
        </div>
        <PaymentEventTimeline events={events} />
      </section>
    </div>
  );
}
