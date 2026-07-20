import Link from "next/link";
import { AdminField } from "@/components/admin/AdminField";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPageTracker } from "@/components/admin/AdminPageTracker";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { getAdminUsers } from "@/lib/admin/data/users";
import { getParam, type AdminSearchParams } from "@/lib/admin/data/utils";

export const dynamic = "force-dynamic";

type AdminUsersPageProps = {
  searchParams?: AdminSearchParams;
};

const inputClass =
  "mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15";

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleDateString("vi-VN") : "Chưa có";
}

export default async function AdminUsersPage(props: AdminUsersPageProps) {
  const searchParams = await props.searchParams;
  const { filters, result, selectedUser } = await getAdminUsers(searchParams);
  const filterApplied = Boolean(
    getParam(searchParams, "q") ||
      getParam(searchParams, "role") ||
      getParam(searchParams, "industry") ||
      getParam(searchParams, "onboarding") ||
      getParam(searchParams, "fromDate") ||
      getParam(searchParams, "toDate"),
  );

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageTracker filterApplied={filterApplied} page="users" />
      <AdminPageHeader
        description="Theo dõi app user, onboarding và mức độ sử dụng tổng hợp."
        title="Người dùng"
      />

      <div className="mt-6">
        <AdminFilterBar action="/admin/users" resetHref="/admin/users">
          <AdminField label="Email hoặc họ tên">
            <input className={inputClass} defaultValue={getParam(searchParams, "q") || ""} name="q" />
          </AdminField>
          <AdminField label="Vai trò">
            <select className={inputClass} defaultValue={getParam(searchParams, "role") || ""} name="role">
              <option value="">Tất cả</option>
              {filters.roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label="Ngành">
            <select className={inputClass} defaultValue={getParam(searchParams, "industry") || ""} name="industry">
              <option value="">Tất cả</option>
              {filters.industries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label="Onboarding">
            <select className={inputClass} defaultValue={getParam(searchParams, "onboarding") || ""} name="onboarding">
              <option value="">Tất cả</option>
              <option value="true">Đã hoàn tất</option>
              <option value="false">Chưa hoàn tất</option>
            </select>
          </AdminField>
          <AdminField label="Từ ngày">
            <input className={inputClass} defaultValue={getParam(searchParams, "fromDate") || ""} name="fromDate" type="date" />
          </AdminField>
          <AdminField label="Đến ngày">
            <input className={inputClass} defaultValue={getParam(searchParams, "toDate") || ""} name="toDate" type="date" />
          </AdminField>
        </AdminFilterBar>
      </div>

      {selectedUser ? (
        <section className="mb-5 rounded-lg border border-ocean/20 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-ink">
                {selectedUser.fullName || selectedUser.email}
              </h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                {selectedUser.email}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {selectedUser.roleType || "Chưa có vai trò"} ·{" "}
                {selectedUser.industry || "Chưa có ngành"} ·{" "}
                {selectedUser.area || "Chưa có khu vực"}
              </p>
            </div>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-ink hover:border-ocean"
              href="/admin/users"
            >
              Đóng chi tiết
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Lead", selectedUser.leadCount],
              ["Note", selectedUser.noteCount],
              ["Reminder", selectedUser.reminderCount],
              ["Map search", selectedUser.mapSearchCount],
              ["Route search", selectedUser.routeSearchCount],
              ["Feedback", selectedUser.feedbackCount],
              ["Upgrade interest", selectedUser.upgradeInterestCount],
            ].map(([label, value]) => (
              <div className="rounded-lg bg-slate-50 px-4 py-3" key={label}>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  {label}
                </p>
                <p className="mt-1 text-lg font-bold text-ink">{value}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <AdminTable
        empty={result.items.length === 0}
        headers={[
          "Ngày tạo",
          "Họ tên",
          "Email",
          "Vai trò",
          "Ngành",
          "Khu vực",
          "Onboarding",
          "Admin?",
          "Lead",
          "Reminder",
          "Map",
          "Route",
          "Feedback",
          "Upgrade",
          "Chi tiết",
        ]}
      >
        {result.items.map((user) => (
          <tr key={user.userId}>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(user.createdAt)}</td>
            <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{user.fullName || "Chưa có tên"}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{user.email}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{user.roleType || "Chưa có"}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{user.industry || "Chưa có"}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-600">{user.area || "Chưa có"}</td>
            <td className="whitespace-nowrap px-4 py-3">
              <AdminStatusBadge value={user.onboardingCompleted ? "done" : "pending"} />
            </td>
            <td className="whitespace-nowrap px-4 py-3">
              <AdminStatusBadge value={user.isAdmin ? "admin" : "user"} />
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">{user.leadCount}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">{user.reminderCount}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">{user.mapSearchCount}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">{user.routeSearchCount}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">{user.feedbackCount}</td>
            <td className="whitespace-nowrap px-4 py-3 text-slate-700">{user.upgradeInterestCount}</td>
            <td className="whitespace-nowrap px-4 py-3">
              <Link
                className="font-bold text-ocean hover:text-ink"
                href={`/admin/users?selectedUser=${user.userId}`}
              >
                Xem
              </Link>
            </td>
          </tr>
        ))}
      </AdminTable>

      <AdminPagination
        basePath="/admin/users"
        limit={result.limit}
        page={result.page}
        params={searchParams}
        totalPages={result.totalPages}
      />
    </div>
  );
}
