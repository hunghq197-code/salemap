import Link from "next/link";
import {
  cancelBillingPaymentAction,
  markBillingPaymentFailedAction,
  markBillingPaymentPaidAction,
} from "@/app/admin/payments/actions";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { getAdminBillingPayments } from "@/lib/admin/data/billing-payments";
import { getAdminPaymentGatewayTransactions } from "@/lib/admin/data/payment-gateway";
import { getAdminPaymentRequests } from "@/lib/admin/data/payment-requests";
import type { AdminSearchParams } from "@/lib/admin/data/utils";

export const dynamic = "force-dynamic";

type AdminPaymentsPageProps = {
  searchParams?: AdminSearchParams;
};

function formatDate(value?: string | null) {
  if (!value) {
    return "Chưa có";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(Number(value ?? 0));
}

export default async function AdminPaymentsPage(props: AdminPaymentsPageProps) {
  const searchParams = await props.searchParams;
  const [billingPayments, manualPayments, gatewayPayments] = await Promise.all([
    getAdminBillingPayments(searchParams),
    getAdminPaymentRequests(searchParams),
    getAdminPaymentGatewayTransactions(searchParams),
  ]);
  const billingPaid = billingPayments.items.filter((item) => item.status === "paid").length;
  const billingPending = billingPayments.items.filter((item) =>
    ["pending", "processing", "waiting_confirmation"].includes(item.status),
  ).length;
  const paidManual = manualPayments.items.filter((item) => item.status === "paid").length;
  const pendingManual = manualPayments.items.filter((item) =>
    ["pending", "waiting_confirmation"].includes(item.status),
  ).length;
  const gatewayPaid = gatewayPayments.items.filter((item) => item.status === "paid").length;

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Theo dõi thanh toán thủ công và payOS ở dạng summary. Không hiển thị secret, checksum hoặc raw webhook payload."
        title="Thanh toán"
      />

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard label="Billing pending" value={billingPending} />
        <AdminKpiCard label="Billing paid" value={billingPaid} />
        <AdminKpiCard label="Legacy manual" value={`${pendingManual}/${paidManual}`} />
        <AdminKpiCard label="payOS paid" value={gatewayPaid} />
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-ink">Billing provider payments</h2>
          <p className="text-sm font-semibold text-slate-500">
            Manual/VietQR/payOS theo architecture mới
          </p>
        </div>
        {!billingPayments.schemaReady ? (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
            Chưa thấy bảng payments/payment_events. Hãy chạy file SQL billing-provider-architecture trong Supabase.
          </div>
        ) : null}
        <AdminTable
          empty={billingPayments.items.length === 0}
          headers={[
            "Ngày",
            "Order",
            "User",
            "Provider",
            "Plan",
            "Amount",
            "Status",
            "Confirmed",
            "Paid at",
            "Actions",
          ]}
        >
          {billingPayments.items.slice(0, 50).map((item) => {
            const canMutate = !["paid", "failed", "cancelled", "refunded"].includes(item.status);
            const markPaidAction = markBillingPaymentPaidAction.bind(null, item.id);
            const markFailedAction = markBillingPaymentFailedAction.bind(null, item.id);
            const cancelAction = cancelBillingPaymentAction.bind(null, item.id);

            return (
              <tr key={item.id}>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(item.created_at)}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <p className="font-mono text-xs font-bold text-ink">{item.order_code}</p>
                  <p className="font-mono text-xs text-slate-500">{item.payment_code || "Chưa có"}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <p className="font-bold text-ink">{item.userLabel}</p>
                  <p className="text-xs text-slate-500">{item.userEmail || "Chưa có email"}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">{item.provider}</td>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{item.plan_id}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatCurrency(item.amount)}</td>
                <td className="whitespace-nowrap px-4 py-3"><AdminStatusBadge value={item.status} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(item.user_confirmed_transfer_at)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(item.paid_at)}</td>
                <td className="min-w-[320px] px-4 py-3">
                  {canMutate ? (
                    <div className="space-y-2">
                      <form action={markPaidAction} className="flex gap-2">
                        <input className="min-h-9 w-36 rounded-lg border border-slate-200 px-2 py-1 text-xs" name="adminNote" placeholder="Ghi chú" />
                        <button className="min-h-9 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white" type="submit">
                          Mark paid
                        </button>
                      </form>
                      <div className="flex gap-2">
                        <form action={markFailedAction}>
                          <button className="min-h-9 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white" type="submit">
                            Failed
                          </button>
                        </form>
                        <form action={cancelAction}>
                          <button className="min-h-9 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white" type="submit">
                            Cancel
                          </button>
                        </form>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-slate-500">Đã xử lý</span>
                  )}
                </td>
              </tr>
            );
          })}
        </AdminTable>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-ink">Manual payment requests</h2>
          <Link className="text-sm font-bold text-ocean hover:text-ink" href="/admin/payment-requests">
            Mở trang xử lý
          </Link>
        </div>
        <AdminTable
          empty={manualPayments.items.length === 0}
          headers={["Ngày", "User", "Plan", "Amount", "Status", "Reviewer"]}
        >
          {manualPayments.items.slice(0, 20).map((item) => (
            <tr key={item.id}>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(item.created_at)}</td>
              <td className="whitespace-nowrap px-4 py-3">
                <p className="font-bold text-ink">{item.userLabel}</p>
                <p className="text-xs text-slate-500">{item.userEmail || "Chưa có email"}</p>
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{item.plan_name}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatCurrency(item.amount_vnd)}</td>
              <td className="whitespace-nowrap px-4 py-3"><AdminStatusBadge value={item.status} /></td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{item.reviewedByLabel || "Chưa review"}</td>
            </tr>
          ))}
        </AdminTable>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-ink">payOS gateway transactions</h2>
          <Link className="text-sm font-bold text-ocean hover:text-ink" href="/admin/payment-gateway">
            Mở cổng thanh toán
          </Link>
        </div>
        <AdminTable
          empty={gatewayPayments.items.length === 0}
          headers={["Ngày", "Order", "User", "Plan", "Amount", "Provider", "Status", "Paid at"]}
        >
          {gatewayPayments.items.slice(0, 20).map((item) => (
            <tr key={item.id}>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(item.created_at)}</td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-700">{item.order_code}</td>
              <td className="whitespace-nowrap px-4 py-3">
                <p className="font-bold text-ink">{item.userLabel}</p>
                <p className="text-xs text-slate-500">{item.userEmail || "Chưa có email"}</p>
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{item.plan_name}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatCurrency(item.amount_vnd)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{item.provider}</td>
              <td className="whitespace-nowrap px-4 py-3"><AdminStatusBadge value={item.status} /></td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(item.paid_at)}</td>
            </tr>
          ))}
        </AdminTable>
      </section>
    </div>
  );
}
