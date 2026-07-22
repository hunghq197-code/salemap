import { Ban, CheckCircle2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  suspendUserAction,
  unsuspendUserAction,
} from "@/app/admin/users/actions";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { getAdminUserDetail } from "@/lib/admin/data/users";

export const dynamic = "force-dynamic";

type AdminUserDetailPageProps = {
  params: Promise<{
    userId: string;
  }>;
};

function formatDate(value?: string | null) {
  if (!value) {
    return "Chưa có";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function valueText(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Theo gói";
  }

  if (typeof value === "boolean") {
    return value ? "Bật" : "Tắt";
  }

  return String(value);
}

export default async function AdminUserDetailPage(props: AdminUserDetailPageProps) {
  const { userId } = await props.params;
  const user = await getAdminUserDetail(userId);

  if (!user) {
    notFound();
  }

  const suspendAction = suspendUserAction.bind(null, user.userId);
  const unsuspendAction = unsuspendUserAction.bind(null, user.userId);

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Tóm tắt tài khoản, gói dịch vụ, usage và quyền override. Không hiển thị phone, địa chỉ, note hoặc raw Google Maps payload mặc định."
        title="Chi tiết người dùng"
      />

      <div className="mt-6 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink">
            {user.fullName || user.email || user.userId}
          </h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">{user.email || "Chưa có email"}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Tạo ngày {formatDate(user.createdAt)} · Hoạt động gần nhất {formatDate(user.lastActivityAt)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <AdminStatusBadge value={user.accountStatus} />
            <AdminStatusBadge value={user.adminRole || "app_user"} />
            <AdminStatusBadge value={user.subscription?.status || "no_subscription"} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-ink hover:border-ocean"
            href="/admin/users"
          >
            Về danh sách
          </Link>
          {user.accountStatus === "suspended" ? (
            <form action={unsuspendAction}>
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
                type="submit"
              >
                <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                Mở khóa
              </button>
            </form>
          ) : (
            <form action={suspendAction}>
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white"
                type="submit"
              >
                <Ban aria-hidden="true" className="h-4 w-4" />
                Khóa user
              </button>
            </form>
          )}
        </div>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminKpiCard label="Lead" value={user.leadCount} />
        <AdminKpiCard label="Task" value={user.taskCount} />
        <AdminKpiCard label="Cadence" value={user.cadenceCount} />
        <AdminKpiCard label="Map search" value={user.mapSearchCount} />
        <AdminKpiCard label="AI request" value={user.aiRequestCount} />
        <AdminKpiCard label="Import job" value={user.importJobCount} />
        <AdminKpiCard label="Payment request" value={user.paymentRequestCount} />
        <AdminKpiCard label="Gateway payment" value={user.gatewayPaymentCount} />
        <AdminKpiCard label="Security event" value={user.securityEventCount} />
        <AdminKpiCard label="Support access" value={user.supportAccessCount} />
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-ink">Gói dịch vụ</h2>
          {user.subscription ? (
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <p><strong>Plan:</strong> {user.subscription.planDisplayName}</p>
              <p><strong>Status:</strong> {user.subscription.status}</p>
              <p><strong>Bắt đầu:</strong> {formatDate(user.subscription.current_period_start)}</p>
              <p><strong>Kết thúc:</strong> {formatDate(user.subscription.current_period_end)}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm font-semibold text-slate-500">Chưa có subscription.</p>
          )}
          <Link
            className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-ink hover:border-ocean"
            href={`/admin/subscriptions?selectedUser=${user.userId}`}
          >
            Xem subscription events
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
          </Link>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-ink">Hồ sơ app</h2>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <p><strong>Vai trò:</strong> {user.roleType || "Chưa có"}</p>
            <p><strong>Ngành:</strong> {user.industry || "Chưa có"}</p>
            <p><strong>Khu vực:</strong> {user.area || "Chưa có"}</p>
            <p><strong>Onboarding:</strong> {user.onboardingCompleted ? "Đã hoàn tất" : "Chưa hoàn tất"}</p>
          </div>
        </article>
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-2">
        <article>
          <h2 className="mb-3 text-xl font-bold text-ink">Quota override</h2>
          <AdminTable
            headers={["Loại quota", "Giá trị"]}
            empty={!user.quotaOverride}
          >
            {Object.entries(user.quotaOverride ?? {}).map(([key, value]) => (
              <tr key={key}>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{key}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">{valueText(value)}</td>
              </tr>
            ))}
          </AdminTable>
        </article>

        <article>
          <h2 className="mb-3 text-xl font-bold text-ink">Feature override</h2>
          <AdminTable
            headers={["Feature", "Trạng thái"]}
            empty={!user.featureOverride}
          >
            {Object.entries(user.featureOverride ?? {}).map(([key, value]) => (
              <tr key={key}>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{key}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">{valueText(value)}</td>
              </tr>
            ))}
          </AdminTable>
        </article>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-bold text-ink">Usage gần đây</h2>
        <AdminTable
          empty={user.usageSummary.length === 0}
          headers={["Ngày", "Action", "Đã dùng", "Limit"]}
        >
          {user.usageSummary.map((row) => (
            <tr key={`${row.usageDate}:${row.actionType}`}>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.usageDate}</td>
              <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{row.label}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{row.usedCount}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{row.limitCount}</td>
            </tr>
          ))}
        </AdminTable>
      </section>
    </div>
  );
}
