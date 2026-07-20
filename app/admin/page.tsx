import {
  Activity,
  BellRing,
  Flag,
  MailCheck,
  MailWarning,
  MapPinned,
  MessageSquareText,
  Route,
  TrendingUp,
  UserCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPageTracker } from "@/components/admin/AdminPageTracker";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { getAdminOverviewData } from "@/lib/admin/data/overview";

export const dynamic = "force-dynamic";

function formatDate(value?: string) {
  if (!value) {
    return "Chưa có";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminOverviewPage() {
  const data = await getAdminOverviewData();

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageTracker page="dashboard" />
      <AdminPageHeader
        description="Theo dõi user, feedback, usage và tín hiệu nâng cấp của SaleMap."
        title="Admin Dashboard"
      />

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard icon={<UsersRound className="h-5 w-5" />} label="Tổng user app" value={data.kpis.users} />
        <AdminKpiCard icon={<UserCheck className="h-5 w-5" />} label="Onboarding hoàn tất" value={data.kpis.onboardingCompleted} />
        <AdminKpiCard icon={<Flag className="h-5 w-5" />} label="Signup landing" value={data.kpis.betaSignups} />
        <AdminKpiCard icon={<Activity className="h-5 w-5" />} label="Tổng lead" value={data.kpis.leads} />
        <AdminKpiCard icon={<MapPinned className="h-5 w-5" />} label="Map search" value={data.kpis.mapSearches} />
        <AdminKpiCard icon={<Route className="h-5 w-5" />} label="Route search" value={data.kpis.routeSearches} />
        <AdminKpiCard icon={<MessageSquareText className="h-5 w-5" />} label="Feedback" value={data.kpis.feedback} />
        <AdminKpiCard icon={<TrendingUp className="h-5 w-5" />} label="Upgrade interest" value={data.kpis.upgradeInterests} />
        <AdminKpiCard icon={<BellRing className="h-5 w-5" />} label="Notifications hôm nay" value={data.kpis.notificationsCreatedToday} />
        <AdminKpiCard icon={<MailCheck className="h-5 w-5" />} label="Reminder email hôm nay" value={data.kpis.reminderEmailsSentToday} />
        <AdminKpiCard icon={<MailCheck className="h-5 w-5" />} label="Daily digest hôm nay" value={data.kpis.dailyDigestSentToday} />
        <AdminKpiCard icon={<MailWarning className="h-5 w-5" />} label="Email failures" value={data.kpis.emailFailuresToday} />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-bold text-ink">Activation funnel</h2>
        <AdminTable
          headers={[
            "Bước",
            "User",
            "Tỷ lệ so với bước trước",
            "Tỷ lệ so với tổng user",
          ]}
        >
          {data.funnel.map((item) => (
            <tr key={item.label}>
              <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{item.label}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{item.users}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{item.rateFromPrevious}%</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{item.rateFromTotal}%</td>
            </tr>
          ))}
        </AdminTable>
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-2">
        <article>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-ink">User mới gần đây</h2>
            <Link className="text-sm font-bold text-ocean hover:text-ink" href="/admin/users">
              Xem tất cả
            </Link>
          </div>
          <AdminTable empty={data.recent.users.length === 0} headers={["Ngày", "User", "Email"]}>
            {data.recent.users.map((user) => (
              <tr key={user.id}>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(user.createdAt)}</td>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{user.fullName || "Chưa có tên"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{user.email || "Chưa có email"}</td>
              </tr>
            ))}
          </AdminTable>
        </article>

        <article>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-ink">Feedback mới nhất</h2>
            <Link className="text-sm font-bold text-ocean hover:text-ink" href="/admin/feedback">
              Xem tất cả
            </Link>
          </div>
          <AdminTable empty={data.recent.feedback.length === 0} headers={["Ngày", "User", "Type", "Status"]}>
            {data.recent.feedback.map((feedback) => (
              <tr key={feedback.id}>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(feedback.created_at)}</td>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{feedback.userLabel}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{feedback.feedback_type}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <AdminStatusBadge value={feedback.status} />
                </td>
              </tr>
            ))}
          </AdminTable>
        </article>

        <article>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-ink">Upgrade interest mới nhất</h2>
            <Link className="text-sm font-bold text-ocean hover:text-ink" href="/admin/upgrade-interests">
              Xem tất cả
            </Link>
          </div>
          <AdminTable empty={data.recent.upgradeInterests.length === 0} headers={["Ngày", "User", "Plan", "Status"]}>
            {data.recent.upgradeInterests.map((interest) => (
              <tr key={interest.id}>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(interest.created_at)}</td>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{interest.userLabel}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{interest.plan_name}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <AdminStatusBadge value={interest.status} />
                </td>
              </tr>
            ))}
          </AdminTable>
        </article>

        <article>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-ink">Đăng ký mới nhất</h2>
            <Link className="text-sm font-bold text-ocean hover:text-ink" href="/admin/beta-signups">
              Xem tất cả
            </Link>
          </div>
          <AdminTable empty={data.recent.betaSignups.length === 0} headers={["Ngày", "Tên", "Persona", "Status"]}>
            {data.recent.betaSignups.map((signup) => (
              <tr key={signup.id}>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(signup.created_at)}</td>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{signup.full_name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{signup.persona_label || "Chưa phân loại"}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <AdminStatusBadge value={signup.contact_status} />
                </td>
              </tr>
            ))}
          </AdminTable>
        </article>
      </section>
    </div>
  );
}
