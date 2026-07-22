import Link from "next/link";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
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
  const [manualPayments, gatewayPayments] = await Promise.all([
    getAdminPaymentRequests(searchParams),
    getAdminPaymentGatewayTransactions(searchParams),
  ]);
  const paidManual = manualPayments.items.filter((item) => item.status === "paid").length;
  const pendingManual = manualPayments.items.filter((item) =>
    ["pending", "waiting_confirmation"].includes(item.status),
  ).length;
  const gatewayPaid = gatewayPayments.items.filter((item) => item.status === "paid").length;
  const gatewayFailed = gatewayPayments.items.filter((item) =>
    ["cancelled", "expired", "failed"].includes(item.status),
  ).length;

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Theo dõi thanh toán thủ công và payOS ở dạng summary. Không hiển thị secret, checksum hoặc raw webhook payload."
        title="Thanh toán"
      />

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard label="Manual pending" value={pendingManual} />
        <AdminKpiCard label="Manual paid" value={paidManual} />
        <AdminKpiCard label="payOS paid" value={gatewayPaid} />
        <AdminKpiCard label="payOS failed/cancelled" value={gatewayFailed} />
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
