import { CheckCircle2, CreditCard, XCircle } from "lucide-react";
import {
  approvePaymentRequestAction,
  rejectPaymentRequestAction,
} from "@/app/admin/payment-requests/actions";
import { AdminField } from "@/components/admin/AdminField";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { getAdminPaymentRequests } from "@/lib/admin/data/payment-requests";

export const dynamic = "force-dynamic";

type AdminPaymentRequestsPageProps = {
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

function canReview(status: string) {
  return status === "pending" || status === "waiting_confirmation";
}

export default async function AdminPaymentRequestsPage(props: AdminPaymentRequestsPageProps) {
  const searchParams = await props.searchParams;
  const params = {
    fromDate: getString(searchParams?.fromDate) || undefined,
    planKey: getString(searchParams?.planKey) || undefined,
    q: getString(searchParams?.q) || undefined,
    status: getString(searchParams?.status) || undefined,
    toDate: getString(searchParams?.toDate) || undefined,
  };
  const data = await getAdminPaymentRequests(params);

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Duyệt yêu cầu chuyển khoản thủ công, kích hoạt subscription và theo dõi các gói Pro/Pro Plus."
        title="Thanh toán thủ công"
      />

      {!data.schemaReady ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
          Chưa thấy bảng payment_requests. Hãy chạy file SQL manual-payment-subscription trong Supabase trước.
        </div>
      ) : null}

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        <AdminKpiCard
          icon={<CreditCard className="h-5 w-5" />}
          label="Tổng request"
          value={data.items.length}
        />
        <AdminKpiCard
          label="Chờ chuyển khoản"
          value={data.items.filter((item) => item.status === "pending").length}
        />
        <AdminKpiCard
          label="Chờ xác nhận"
          value={data.items.filter((item) => item.status === "waiting_confirmation").length}
        />
        <AdminKpiCard
          label="Đã thanh toán"
          value={data.items.filter((item) => item.status === "paid").length}
        />
      </section>

      <form className="mt-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm" method="get">
        <div className="grid gap-4 md:grid-cols-5">
          <AdminField label="Status">
            <select className={inputClass} defaultValue={params.status || ""} name="status">
              <option value="">Tất cả</option>
              <option value="pending">pending</option>
              <option value="waiting_confirmation">waiting_confirmation</option>
              <option value="paid">paid</option>
              <option value="rejected">rejected</option>
              <option value="cancelled">cancelled</option>
            </select>
          </AdminField>
          <AdminField label="Plan">
            <select className={inputClass} defaultValue={params.planKey || ""} name="planKey">
              <option value="">Tất cả</option>
              <option value="pro">Pro</option>
              <option value="pro_plus">Pro Plus</option>
            </select>
          </AdminField>
          <AdminField label="Từ ngày">
            <input className={inputClass} defaultValue={params.fromDate || ""} name="fromDate" type="date" />
          </AdminField>
          <AdminField label="Đến ngày">
            <input className={inputClass} defaultValue={params.toDate || ""} name="toDate" type="date" />
          </AdminField>
          <AdminField label="User search">
            <input className={inputClass} defaultValue={params.q || ""} name="q" placeholder="Tên, email, mã GD" />
          </AdminField>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-5 py-2.5 text-sm font-bold text-white md:col-span-5"
            type="submit"
          >
            Lọc payment requests
          </button>
        </div>
      </form>

      <section className="mt-8">
        <AdminTable
          empty={data.items.length === 0}
          headers={[
            "Ngày tạo",
            "User",
            "Email",
            "Plan",
            "Amount",
            "Status",
            "Transfer content",
            "Transaction ref",
            "User note",
            "Reviewed by",
            "Reviewed at",
            "Actions",
          ]}
        >
          {data.items.map((item) => {
            const approveAction = approvePaymentRequestAction.bind(null, item.id);
            const rejectAction = rejectPaymentRequestAction.bind(null, item.id);

            return (
              <tr key={item.id}>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(item.created_at)}</td>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{item.userLabel}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{item.userEmail || "Chưa có"}</td>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{item.plan_name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatCurrency(item.amount_vnd)}</td>
                <td className="whitespace-nowrap px-4 py-3"><AdminStatusBadge value={item.status} /></td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-bold text-ink">{item.transfer_content || "Chưa có"}</td>
                <td className="min-w-[160px] px-4 py-3 text-slate-600">{item.transaction_reference || "Chưa có"}</td>
                <td className="min-w-[220px] px-4 py-3 text-slate-600">{item.user_note || "Chưa có"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{item.reviewedByLabel || "Chưa có"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(item.reviewed_at)}</td>
                <td className="min-w-[280px] px-4 py-3">
                  {canReview(item.status) ? (
                    <div className="space-y-2">
                      <form action={approveAction} className="flex gap-2">
                        <input className="min-h-9 w-40 rounded-lg border border-slate-200 px-2 py-1 text-xs" name="adminNote" placeholder="Ghi chú admin" />
                        <button className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white" type="submit">
                          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                          Approve
                        </button>
                      </form>
                      <form action={rejectAction} className="flex gap-2">
                        <input className="min-h-9 w-40 rounded-lg border border-slate-200 px-2 py-1 text-xs" name="adminNote" placeholder="Lý do từ chối" />
                        <button className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white" type="submit">
                          <XCircle aria-hidden="true" className="h-4 w-4" />
                          Reject
                        </button>
                      </form>
                    </div>
                  ) : (
                    <span className="text-sm font-semibold text-slate-500">Đã xử lý</span>
                  )}
                </td>
              </tr>
            );
          })}
        </AdminTable>
      </section>
    </div>
  );
}
