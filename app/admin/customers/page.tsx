import {
  BadgeDollarSign,
  Clock3,
  CreditCard,
  UserPlus,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { AdminField } from "@/components/admin/AdminField";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPageTracker } from "@/components/admin/AdminPageTracker";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { getAdminCustomers } from "@/lib/admin/data/customers";
import { getParam, type AdminSearchParams } from "@/lib/admin/data/utils";

export const dynamic = "force-dynamic";

type AdminCustomersPageProps = {
  searchParams?: AdminSearchParams;
};

const inputClass =
  "mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15";

function formatDate(value?: string | null) {
  if (!value) return "Chưa có";

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

export default async function AdminCustomersPage(props: AdminCustomersPageProps) {
  const searchParams = await props.searchParams;
  const data = await getAdminCustomers(searchParams);
  const filterApplied = Boolean(
    getParam(searchParams, "q") ||
      getParam(searchParams, "accountStatus") ||
      getParam(searchParams, "lifecycle") ||
      getParam(searchParams, "plan") ||
      getParam(searchParams, "subscriptionStatus") ||
      getParam(searchParams, "paidStatus") ||
      getParam(searchParams, "fromDate") ||
      getParam(searchParams, "toDate"),
  );

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageTracker filterApplied={filterApplied} page="customers" />
      <AdminPageHeader
        description="Quản lý customer của SaleMap theo account, lifecycle, gói dịch vụ, usage và billing. Trang này không đọc dữ liệu lead riêng tư."
        title="Khách hàng"
      />

      {!data.schemaReady ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          CRM schema chưa sẵn sàng. Hãy chạy `supabase/admin-customer-crm.sql`
          trước khi dùng tags, notes và lifecycle override.
        </div>
      ) : null}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminKpiCard
          icon={<UsersRound className="h-5 w-5" />}
          label="Tổng customer"
          value={data.kpis.totalCustomers}
        />
        <AdminKpiCard
          icon={<UserPlus className="h-5 w-5" />}
          label="Customer mới 30 ngày"
          value={data.kpis.newCustomers30d}
        />
        <AdminKpiCard
          icon={<CreditCard className="h-5 w-5" />}
          label="Đang trả phí"
          value={data.kpis.activePaidCustomers}
        />
        <AdminKpiCard
          icon={<BadgeDollarSign className="h-5 w-5" />}
          label="Doanh thu đã trả"
          value={formatCurrency(data.kpis.paidRevenue)}
        />
        <AdminKpiCard
          icon={<Clock3 className="h-5 w-5" />}
          label="Payment chờ xử lý"
          value={data.kpis.pendingPayments}
        />
      </section>

      <div className="mt-6">
        <AdminFilterBar action="/admin/customers" resetHref="/admin/customers">
          <AdminField label="Tên, email cache hoặc mã customer">
            <input
              className={inputClass}
              defaultValue={getParam(searchParams, "q") || ""}
              name="q"
            />
          </AdminField>
          <AdminField label="Account status">
            <select
              className={inputClass}
              defaultValue={getParam(searchParams, "accountStatus") || ""}
              name="accountStatus"
            >
              <option value="">Tất cả</option>
              {data.filters.accountStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label="Lifecycle">
            <select
              className={inputClass}
              defaultValue={getParam(searchParams, "lifecycle") || ""}
              name="lifecycle"
            >
              <option value="">Tất cả</option>
              {data.filters.lifecycleValues.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label="Plan">
            <select
              className={inputClass}
              defaultValue={getParam(searchParams, "plan") || ""}
              name="plan"
            >
              <option value="">Tất cả</option>
              {data.filters.planKeys.map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label="Subscription">
            <select
              className={inputClass}
              defaultValue={getParam(searchParams, "subscriptionStatus") || ""}
              name="subscriptionStatus"
            >
              <option value="">Tất cả</option>
              {data.filters.subscriptionStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label="Thanh toán">
            <select
              className={inputClass}
              defaultValue={getParam(searchParams, "paidStatus") || ""}
              name="paidStatus"
            >
              <option value="">Tất cả</option>
              <option value="has_paid">Đã từng trả</option>
              <option value="never_paid">Chưa từng trả</option>
            </select>
          </AdminField>
          <AdminField label="Từ ngày">
            <input
              className={inputClass}
              defaultValue={getParam(searchParams, "fromDate") || ""}
              name="fromDate"
              type="date"
            />
          </AdminField>
          <AdminField label="Đến ngày">
            <input
              className={inputClass}
              defaultValue={getParam(searchParams, "toDate") || ""}
              name="toDate"
              type="date"
            />
          </AdminField>
        </AdminFilterBar>
      </div>

      <div className="mt-6">
        <AdminTable
          empty={data.result.items.length === 0}
          headers={[
            "Customer",
            "Lifecycle",
            "Account",
            "Plan",
            "Subscription",
            "Tổng chi tiêu",
            "Tickets",
            "Usage",
            "Tags",
            "Đăng ký",
            "Hoạt động gần nhất",
            "Chi tiết",
          ]}
        >
          {data.result.items.map((customer) => (
            <tr key={customer.userId}>
              <td className="whitespace-nowrap px-4 py-3">
                <div className="font-bold text-ink">
                  {customer.fullName || customer.email || customer.customerCode}
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-500">
                  {customer.email || "Chưa có email"} · {customer.customerCode}
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <AdminStatusBadge value={customer.lifecycle} />
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <AdminStatusBadge value={customer.accountStatus} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700">
                {customer.currentPlan}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <AdminStatusBadge value={customer.subscriptionStatus} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700">
                {formatCurrency(customer.totalPaid)}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <AdminStatusBadge
                  tone={customer.openTicketCount > 0 ? "yellow" : "green"}
                  value={`${customer.openTicketCount} mở`}
                />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                {customer.leadCount} lead · {customer.taskCount} task ·{" "}
                {customer.mapSearchCount} map
              </td>
              <td className="min-w-44 px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {customer.tags.length > 0 ? (
                    customer.tags.slice(0, 3).map((tag) => (
                      <AdminStatusBadge key={tag.id} tone="blue" value={tag.name} />
                    ))
                  ) : (
                    <span className="text-sm font-semibold text-slate-500">
                      Chưa có
                    </span>
                  )}
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {formatDate(customer.createdAt)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {formatDate(customer.lastActivityAt)}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <Link
                  className="font-bold text-ocean hover:text-ink"
                  href={`/admin/customers/${customer.userId}`}
                >
                  Customer 360
                </Link>
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>

      <AdminPagination
        basePath="/admin/customers"
        limit={data.result.limit}
        page={data.result.page}
        params={searchParams}
        totalPages={data.result.totalPages}
      />
    </div>
  );
}
