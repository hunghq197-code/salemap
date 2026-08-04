import Link from "next/link";
import {
  cancelBillingPaymentAction,
  markBillingPaymentFailedAction,
  markBillingPaymentPaidAction,
} from "@/app/admin/payments/actions";
import { AdminConfirmSubmitButton } from "@/components/admin/AdminConfirmSubmitButton";
import { AdminField } from "@/components/admin/AdminField";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { ADMIN_PERMISSIONS, hasPermission } from "@/lib/admin/admin-permissions";
import { getAdminContext } from "@/lib/admin/auth";
import { getAdminBillingPayments } from "@/lib/admin/data/billing-payments";
import { getAdminPaymentGatewayTransactions } from "@/lib/admin/data/payment-gateway";
import { getAdminPaymentRequests } from "@/lib/admin/data/payment-requests";
import type { AdminSearchParams } from "@/lib/admin/data/utils";
import { getParam } from "@/lib/admin/data/utils";

export const dynamic = "force-dynamic";

type AdminPaymentsPageProps = {
  searchParams?: AdminSearchParams;
};

const inputClass =
  "mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15";

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
  const [billingPayments, manualPayments, gatewayPayments, admin] = await Promise.all([
    getAdminBillingPayments(searchParams),
    getAdminPaymentRequests(searchParams),
    getAdminPaymentGatewayTransactions(searchParams),
    getAdminContext(),
  ]);
  const canUpdatePayments = Boolean(
    admin && hasPermission(admin.role, ADMIN_PERMISSIONS.UPDATE_PAYMENT_STATUS),
  );
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

      <form className="mt-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm" method="get">
        <div className="grid gap-4 md:grid-cols-6">
          <AdminField label="Tìm kiếm">
            <input className={inputClass} defaultValue={getParam(searchParams, "q") || ""} name="q" placeholder="Email, order, plan" />
          </AdminField>
          <AdminField label="Provider">
            <select className={inputClass} defaultValue={getParam(searchParams, "provider") || ""} name="provider">
              <option value="">Tất cả</option>
              <option value="manual_bank_transfer">Manual</option>
              <option value="vietqr_manual">VietQR</option>
              <option value="payos">payOS</option>
            </select>
          </AdminField>
          <AdminField label="Status">
            <select className={inputClass} defaultValue={getParam(searchParams, "status") || ""} name="status">
              <option value="">Tất cả</option>
              <option value="pending">pending</option>
              <option value="waiting_confirmation">waiting_confirmation</option>
              <option value="processing">processing</option>
              <option value="paid">paid</option>
              <option value="failed">failed</option>
              <option value="cancelled">cancelled</option>
              <option value="expired">expired</option>
            </select>
          </AdminField>
          <AdminField label="Plan">
            <select className={inputClass} defaultValue={getParam(searchParams, "planId") || ""} name="planId">
              <option value="">Tất cả</option>
              <option value="pro">Pro</option>
              <option value="pro_plus">Pro Plus</option>
            </select>
          </AdminField>
          <AdminField label="Từ ngày">
            <input className={inputClass} defaultValue={getParam(searchParams, "fromDate") || ""} name="fromDate" type="date" />
          </AdminField>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-5 py-2.5 text-sm font-bold text-white md:self-end"
            type="submit"
          >
            Lọc payments
          </button>
        </div>
      </form>

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
            "Detail",
            "Actions",
          ]}
        >
          {billingPayments.items.slice(0, 50).map((item) => {
            const canMutate = ["pending", "processing", "waiting_confirmation"].includes(item.status);
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
                <td className="whitespace-nowrap px-4 py-3">
                  <Link className="text-sm font-bold text-ocean hover:text-ink" href={`/admin/payments/${item.id}`}>
                    Mở detail
                  </Link>
                </td>
                <td className="min-w-[320px] px-4 py-3">
                  {canMutate && canUpdatePayments ? (
                    <div className="space-y-2">
                      <form action={markPaidAction} className="flex gap-2">
                        <input className="min-h-9 w-36 rounded-lg border border-slate-200 px-2 py-1 text-xs" name="adminNote" placeholder="Ghi chú" />
                        <AdminConfirmSubmitButton
                          confirmMessage="Xac nhan payment nay da duoc doi soat va mark paid?"
                          icon="check"
                          label="Mark paid"
                          pendingLabel="Dang xu ly"
                          variant="success"
                        />
                      </form>
                      <div className="flex gap-2">
                        <form action={markFailedAction}>
                          <AdminConfirmSubmitButton
                            confirmMessage="Mark payment nay la failed?"
                            icon="warning"
                            label="Failed"
                            variant="warning"
                          />
                        </form>
                        <form action={cancelAction}>
                          <AdminConfirmSubmitButton
                            confirmMessage="Cancel payment nay?"
                            icon="x"
                            label="Cancel"
                            variant="danger"
                          />
                        </form>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-slate-500">
                      {canUpdatePayments ? "Đã xử lý" : "Read-only"}
                    </span>
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
