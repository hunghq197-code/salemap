import { CreditCard, ExternalLink, RefreshCw } from "lucide-react";
import { syncPaymentGatewayAction } from "@/app/admin/payment-gateway/actions";
import { AdminField } from "@/components/admin/AdminField";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { getAdminPaymentGatewayTransactions } from "@/lib/admin/data/payment-gateway";

export const dynamic = "force-dynamic";

type AdminPaymentGatewayPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const inputClass =
  "mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15";

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString("vi-VN") : "Chưa có";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function formatJson(value: unknown) {
  if (!value) {
    return "Chưa có dữ liệu";
  }

  try {
    return JSON.stringify(value, null, 2).slice(0, 5000);
  } catch {
    return "Không đọc được dữ liệu raw";
  }
}

export default async function AdminPaymentGatewayPage(props: AdminPaymentGatewayPageProps) {
  const searchParams = await props.searchParams;
  const params = {
    fromDate: getString(searchParams?.fromDate) || undefined,
    planKey: getString(searchParams?.planKey) || undefined,
    provider: getString(searchParams?.provider) || undefined,
    q: getString(searchParams?.q) || undefined,
    status: getString(searchParams?.status) || undefined,
    toDate: getString(searchParams?.toDate) || undefined,
  };
  const data = await getAdminPaymentGatewayTransactions(params);

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Theo dõi giao dịch payOS, trạng thái checkout, webhook và đồng bộ thủ công khi cần."
        title="Cổng thanh toán"
      />

      {!data.schemaReady ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
          Chưa thấy bảng payment_gateway_transactions. Hãy chạy file SQL payos-payment-gateway-schema trong Supabase trước.
        </div>
      ) : null}

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        <AdminKpiCard
          icon={<CreditCard className="h-5 w-5" />}
          label="Tổng giao dịch"
          value={data.items.length}
        />
        <AdminKpiCard
          label="Chờ thanh toán"
          value={data.items.filter((item) => item.status === "pending").length}
        />
        <AdminKpiCard
          label="Đã thanh toán"
          value={data.items.filter((item) => item.status === "paid").length}
        />
        <AdminKpiCard
          label="Lỗi/hủy"
          value={
            data.items.filter((item) =>
              ["cancelled", "expired", "failed", "unknown"].includes(item.status),
            ).length
          }
        />
      </section>

      <form className="mt-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm" method="get">
        <div className="grid gap-4 md:grid-cols-6">
          <AdminField label="Status">
            <select className={inputClass} defaultValue={params.status || ""} name="status">
              <option value="">Tất cả</option>
              <option value="pending">pending</option>
              <option value="paid">paid</option>
              <option value="cancelled">cancelled</option>
              <option value="expired">expired</option>
              <option value="failed">failed</option>
              <option value="unknown">unknown</option>
            </select>
          </AdminField>
          <AdminField label="Plan">
            <select className={inputClass} defaultValue={params.planKey || ""} name="planKey">
              <option value="">Tất cả</option>
              <option value="pro">Pro</option>
              <option value="pro_plus">Pro Plus</option>
            </select>
          </AdminField>
          <AdminField label="Provider">
            <select className={inputClass} defaultValue={params.provider || ""} name="provider">
              <option value="">Tất cả</option>
              <option value="payos">payOS</option>
            </select>
          </AdminField>
          <AdminField label="Từ ngày">
            <input className={inputClass} defaultValue={params.fromDate || ""} name="fromDate" type="date" />
          </AdminField>
          <AdminField label="Đến ngày">
            <input className={inputClass} defaultValue={params.toDate || ""} name="toDate" type="date" />
          </AdminField>
          <AdminField label="Tìm kiếm">
            <input className={inputClass} defaultValue={params.q || ""} name="q" placeholder="User, order code" />
          </AdminField>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-5 py-2.5 text-sm font-bold text-white md:col-span-6"
            type="submit"
          >
            Lọc giao dịch
          </button>
        </div>
      </form>

      <section className="mt-8">
        <AdminTable
          empty={data.items.length === 0}
          headers={[
            "Ngày tạo",
            "User",
            "Provider",
            "Order code",
            "Payment link id",
            "Plan",
            "Amount",
            "Status",
            "Provider status",
            "Paid at",
            "Payment request",
            "Actions",
          ]}
        >
          {data.items.map((item) => {
            const syncAction = syncPaymentGatewayAction.bind(null, item.id);

            return (
              <tr key={item.id}>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(item.created_at)}</td>
                <td className="min-w-[180px] px-4 py-3">
                  <p className="font-bold text-ink">{item.userLabel}</p>
                  <p className="text-xs text-slate-500">{item.userEmail || "Chưa có email"}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{item.provider}</td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-bold text-ink">{item.order_code}</td>
                <td className="min-w-[180px] px-4 py-3 font-mono text-xs text-slate-600">{item.payment_link_id || "Chưa có"}</td>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{item.plan_name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatCurrency(item.amount_vnd)}</td>
                <td className="whitespace-nowrap px-4 py-3"><AdminStatusBadge value={item.status} /></td>
                <td className="min-w-[140px] px-4 py-3 text-slate-600">{item.provider_status || "Chưa có"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(item.paid_at)}</td>
                <td className="min-w-[160px] px-4 py-3">
                  <p className="font-mono text-xs text-slate-600">{item.payment_request_id || "Chưa có"}</p>
                  <p className="mt-1 text-xs font-bold text-ocean">{item.paymentRequestStatus || ""}</p>
                </td>
                <td className="min-w-[260px] px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <form action={syncAction}>
                      <button className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-ink px-3 py-2 text-xs font-bold text-white" type="submit">
                        <RefreshCw aria-hidden="true" className="h-4 w-4" />
                        Sync status
                      </button>
                    </form>
                    {item.checkout_url ? (
                      <a
                        className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-ink hover:border-ocean"
                        href={item.checkout_url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <ExternalLink aria-hidden="true" className="h-4 w-4" />
                        Open checkout
                      </a>
                    ) : null}
                    <details className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <summary className="cursor-pointer text-xs font-bold text-ink">View detail</summary>
                      <div className="mt-3 space-y-3 text-xs text-slate-600">
                        <p>Subscription id: {item.subscription_id || "Chưa có"}</p>
                        <p>Provider reference: {item.provider_reference || "Chưa có"}</p>
                        <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-white p-3">
                          {formatJson({
                            raw_create_response: item.raw_create_response,
                            raw_status_response: item.raw_status_response,
                            raw_webhook_payload: item.raw_webhook_payload,
                          })}
                        </pre>
                      </div>
                    </details>
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
