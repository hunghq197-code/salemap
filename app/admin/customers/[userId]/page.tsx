import {
  BadgeDollarSign,
  BellRing,
  Clock3,
  FileText,
  MessageSquareText,
  ShieldAlert,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  assignCustomerTagAction,
  createAndAssignCustomerTagAction,
  createCustomerNoteAction,
  deleteCustomerNoteAction,
  removeCustomerTagAction,
  updateCustomerLifecycleAction,
} from "@/app/admin/customers/[userId]/actions";
import { AdminField } from "@/components/admin/AdminField";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { getAdminCustomerDetail } from "@/lib/admin/data/customers";
import {
  customerColorTokenValues,
  customerLifecycleValues,
} from "@/lib/validators/customer-admin";

export const dynamic = "force-dynamic";

type AdminCustomerDetailPageProps = {
  params: Promise<{
    userId: string;
  }>;
};

const inputClass =
  "mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15";

function formatDate(value?: string | null) {
  if (!value) return "Chưa có";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
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

export default async function AdminCustomerDetailPage(
  props: AdminCustomerDetailPageProps,
) {
  const { userId } = await props.params;
  const customer = await getAdminCustomerDetail(userId);

  if (!customer) {
    notFound();
  }

  const updateLifecycle = updateCustomerLifecycleAction.bind(null, customer.userId);
  const createNote = createCustomerNoteAction.bind(null, customer.userId);
  const createTag = createAndAssignCustomerTagAction.bind(null, customer.userId);
  const assignTag = assignCustomerTagAction.bind(null, customer.userId);

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Customer 360 cho customer của SaleMap: account, plan, payment, usage, note nội bộ, tag và lifecycle. Không hiển thị dữ liệu lead riêng tư."
        title="Customer 360"
      />

      {!customer.schemaReady ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          CRM schema chưa sẵn sàng. Hãy chạy `supabase/admin-customer-crm.sql`
          để bật lifecycle, notes và tags.
        </div>
      ) : null}

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-ink">
              {customer.fullName || customer.email || customer.customerCode}
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              {customer.email || "Chưa có email"} · {customer.customerCode}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Đăng ký {formatDate(customer.createdAt)} · Hoạt động gần nhất{" "}
              {formatDate(customer.lastActivityAt)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <AdminStatusBadge value={customer.lifecycle} />
              <AdminStatusBadge value={customer.accountStatus} />
              <AdminStatusBadge value={customer.subscriptionStatus} />
            </div>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-ink hover:border-ocean"
            href="/admin/customers"
          >
            Về danh sách
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminKpiCard label="Tổng chi tiêu" value={formatCurrency(customer.totalPaid)} />
        <AdminKpiCard label="Lead aggregate" value={customer.leadCount} />
        <AdminKpiCard label="Task aggregate" value={customer.taskCount} />
        <AdminKpiCard label="Map usage" value={customer.mapSearchCount} />
        <AdminKpiCard label="AI request" value={customer.aiRequestCount} />
        <AdminKpiCard label="Import job" value={customer.importJobCount} />
        <AdminKpiCard label="Payments" value={customer.billingPaymentCount} />
        <AdminKpiCard label="Notifications" value={customer.notificationCount} />
        <AdminKpiCard label="Security events" value={customer.securityEventCount} />
        <AdminKpiCard label="Support access" value={customer.supportAccessCount} />
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-ink">Account & Plan</h2>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <p>
              <strong>Plan:</strong> {customer.currentPlan}
            </p>
            <p>
              <strong>Subscription:</strong> {customer.subscriptionStatus}
            </p>
            <p>
              <strong>Kết thúc kỳ:</strong>{" "}
              {formatDate(customer.subscriptionEndAt)}
            </p>
            <p>
              <strong>Khu vực:</strong> {customer.area || "Chưa có"}
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {customer.subscription?.id ? (
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-ink hover:border-ocean"
                href={`/admin/subscriptions/${customer.subscription.id}`}
              >
                Mở subscription
              </Link>
            ) : null}
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-ink hover:border-ocean"
              href={`/admin/users/${customer.userId}`}
            >
              Mở user detail cũ
            </Link>
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-ink">Lifecycle</h2>
          <form action={updateLifecycle} className="mt-4 grid gap-3 sm:grid-cols-2">
            <AdminField label="Trạng thái">
              <select
                className={inputClass}
                defaultValue={customer.lifecycle}
                name="lifecycle"
              >
                {customerLifecycleValues.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField label="Lý do">
              <input
                className={inputClass}
                maxLength={500}
                name="reason"
                placeholder="Không ghi dữ liệu lead riêng tư"
              />
            </AdminField>
            <div className="sm:col-span-2">
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ocean px-4 py-2 text-sm font-bold text-white"
                type="submit"
              >
                Cập nhật lifecycle
              </button>
            </div>
          </form>
        </article>
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-2">
        <article>
          <div className="mb-3 flex items-center gap-2">
            <BadgeDollarSign aria-hidden="true" className="h-5 w-5 text-ocean" />
            <h2 className="text-xl font-bold text-ink">Payments gần đây</h2>
          </div>
          <AdminTable
            empty={customer.recentPayments.length === 0}
            headers={["Ngày", "Order", "Provider", "Status", "Amount"]}
          >
            {customer.recentPayments.map((payment) => (
              <tr key={payment.id}>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {formatDate(payment.createdAt)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">
                  {payment.orderCode || payment.id}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                  {payment.provider || "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <AdminStatusBadge value={payment.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                  {formatCurrency(payment.amount)}
                </td>
              </tr>
            ))}
          </AdminTable>
        </article>

        <article>
          <div className="mb-3 flex items-center gap-2">
            <Clock3 aria-hidden="true" className="h-5 w-5 text-ocean" />
            <h2 className="text-xl font-bold text-ink">Subscription events</h2>
          </div>
          <AdminTable
            empty={customer.recentSubscriptionEvents.length === 0}
            headers={["Ngày", "Event", "Plan", "Status"]}
          >
            {customer.recentSubscriptionEvents.map((event) => (
              <tr key={event.id}>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {formatDate(event.createdAt)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">
                  {event.eventType}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                  {event.toPlanKey || "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <AdminStatusBadge value={event.toStatus} />
                </td>
              </tr>
            ))}
          </AdminTable>
        </article>
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Tag aria-hidden="true" className="h-5 w-5 text-ocean" />
            <h2 className="text-xl font-bold text-ink">Customer tags</h2>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {customer.tags.length > 0 ? (
              customer.tags.map((tag) => {
                const removeTag = removeCustomerTagAction.bind(
                  null,
                  customer.userId,
                  tag.id,
                );

                return (
                  <form action={removeTag} key={tag.id}>
                    <button
                      className="inline-flex min-h-9 items-center rounded-full border border-ocean/20 bg-ocean/10 px-3 py-1 text-xs font-bold text-ocean"
                      type="submit"
                    >
                      {tag.name} ×
                    </button>
                  </form>
                );
              })
            ) : (
              <p className="text-sm font-semibold text-slate-500">Chưa có tag.</p>
            )}
          </div>

          <form action={assignTag} className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <AdminField label="Gán tag có sẵn">
              <select className={inputClass} name="tagId">
                {customer.availableTags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </AdminField>
            <div className="flex items-end">
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-ink hover:border-ocean disabled:opacity-60"
                disabled={customer.availableTags.length === 0}
                type="submit"
              >
                Gán tag
              </button>
            </div>
          </form>

          <form action={createTag} className="mt-5 grid gap-3 sm:grid-cols-2">
            <AdminField label="Tag mới">
              <input className={inputClass} maxLength={80} name="name" />
            </AdminField>
            <AdminField label="Màu">
              <select className={inputClass} defaultValue="slate" name="colorToken">
                {customerColorTokenValues.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField label="Mô tả">
              <input className={inputClass} maxLength={500} name="description" />
            </AdminField>
            <div className="flex items-end">
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ocean px-4 py-2 text-sm font-bold text-white"
                type="submit"
              >
                Tạo và gán
              </button>
            </div>
          </form>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <FileText aria-hidden="true" className="h-5 w-5 text-ocean" />
            <h2 className="text-xl font-bold text-ink">Internal notes</h2>
          </div>
          <form action={createNote} className="mt-4">
            <label className="text-sm font-bold text-slate-700" htmlFor="content">
              Ghi chú nội bộ
            </label>
            <textarea
              className="mt-1 min-h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              id="content"
              maxLength={3000}
              name="content"
              placeholder="Không nhập dữ liệu lead riêng tư của user."
              required
            />
            <button
              className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg bg-ocean px-4 py-2 text-sm font-bold text-white"
              type="submit"
            >
              Thêm note
            </button>
          </form>

          <div className="mt-5 space-y-3">
            {customer.notes.length > 0 ? (
              customer.notes.map((note) => {
                const deleteNote = deleteCustomerNoteAction.bind(
                  null,
                  customer.userId,
                  note.id,
                );

                return (
                  <div
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                    key={note.id}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {note.content}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-slate-500">
                        {formatDate(note.createdAt)}
                      </p>
                      <form action={deleteNote}>
                        <button
                          className="text-xs font-bold text-rose-600 hover:text-rose-700"
                          type="submit"
                        >
                          Xóa
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
                Chưa có ghi chú nội bộ.
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-2">
        <article>
          <div className="mb-3 flex items-center gap-2">
            <BellRing aria-hidden="true" className="h-5 w-5 text-ocean" />
            <h2 className="text-xl font-bold text-ink">Usage & quota</h2>
          </div>
          <AdminTable
            empty={customer.usageSummary.length === 0}
            headers={["Ngày", "Action", "Đã dùng", "Limit"]}
          >
            {customer.usageSummary.map((row) => (
              <tr key={`${row.usageDate}:${row.actionType}`}>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {row.usageDate}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">
                  {row.label}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                  {row.usedCount}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                  {row.limitCount}
                </td>
              </tr>
            ))}
          </AdminTable>
        </article>

        <article>
          <div className="mb-3 flex items-center gap-2">
            <ShieldAlert aria-hidden="true" className="h-5 w-5 text-ocean" />
            <h2 className="text-xl font-bold text-ink">Lifecycle timeline</h2>
          </div>
          <AdminTable
            empty={customer.lifecycleEvents.length === 0}
            headers={["Ngày", "Từ", "Đến", "Lý do"]}
          >
            {customer.lifecycleEvents.map((event) => (
              <tr key={event.id}>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {formatDate(event.createdAt)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                  {event.fromLifecycle || "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <AdminStatusBadge value={event.toLifecycle} />
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {event.reason || "Không có"}
                </td>
              </tr>
            ))}
          </AdminTable>
        </article>
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-2">
        <article className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
          <div className="flex items-center gap-2">
            <BadgeDollarSign aria-hidden="true" className="h-5 w-5 text-slate-500" />
            <h2 className="text-xl font-bold text-ink">Orders</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Order management sẽ được triển khai ở Subphase C để tách Order,
            Payment, Subscription và Entitlement Grant.
          </p>
        </article>
        <article className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
          <div className="flex items-center gap-2">
            <MessageSquareText aria-hidden="true" className="h-5 w-5 text-slate-500" />
            <h2 className="text-xl font-bold text-ink">Tickets</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Ticket system sẽ được triển khai ở Subphase D. Customer 360 hiện chỉ
            giữ chỗ, chưa đọc hoặc tạo ticket.
          </p>
        </article>
      </section>
    </div>
  );
}
