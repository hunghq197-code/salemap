import {
  Activity,
  AlertTriangle,
  Clock3,
  CreditCard,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { AdminAlertCenter } from "@/components/admin/dashboard/AdminAlertCenter";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPageTracker } from "@/components/admin/AdminPageTracker";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { getAdminOverviewData } from "@/lib/admin/data/overview";

export const dynamic = "force-dynamic";

function formatDate(value?: string | null) {
  if (!value) {
    return "Chua co";
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
        description="Tinh trang nguoi dung, thanh toan, usage va cac canh bao can chu y."
        title="Tong quan he thong"
      />

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AdminKpiCard
          icon={<UsersRound className="h-5 w-5" />}
          label="Nguoi dung active"
          value={data.operationKpis.activeUsers}
        />
        <AdminKpiCard
          icon={<UserCheck className="h-5 w-5" />}
          label="Dang ky moi 7 ngay"
          value={data.operationKpis.newUsers7d}
        />
        <AdminKpiCard
          icon={<CreditCard className="h-5 w-5" />}
          label="Subscription paid active"
          value={data.operationKpis.activePaidSubscriptions}
        />
        <AdminKpiCard
          icon={<Clock3 className="h-5 w-5" />}
          label="Payment cho xac nhan"
          value={data.operationKpis.pendingPayments}
        />
        <AdminKpiCard
          icon={<ShieldCheck className="h-5 w-5" />}
          label="Security event open"
          value={data.operationKpis.unresolvedSecurityEvents}
        />
        <AdminKpiCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Operation failures"
          value={data.operationKpis.operationFailures}
        />
      </section>

      <AdminAlertCenter alerts={data.alerts} />

      <section className="mt-8 grid gap-5 xl:grid-cols-2">
        <article>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-ink">Ticket can xu ly</h2>
              <p className="mt-1 text-sm text-slate-600">Queue gan nhat, khong hien internal note.</p>
            </div>
            <Link className="text-sm font-bold text-ocean hover:text-ink" href="/admin/tickets">
              Xem tat ca
            </Link>
          </div>
          <AdminTable
            empty={data.recent.supportTickets.length === 0}
            headers={["Ngay", "Ticket", "User", "Status", "Priority"]}
          >
            {data.recent.supportTickets.map((ticket) => (
              <tr key={ticket.id}>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(ticket.created_at)}</td>
                <td className="min-w-[200px] px-4 py-3">
                  <Link className="font-bold text-ocean hover:text-ink" href={`/admin/tickets/${ticket.id}`}>
                    {ticket.subject || ticket.ticket_code || ticket.id}
                  </Link>
                  <p className="mt-1 font-mono text-xs text-slate-500">{ticket.ticket_code}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{ticket.userLabel}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <AdminStatusBadge value={ticket.status || "unknown"} />
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <AdminStatusBadge value={ticket.priority || "normal"} />
                </td>
              </tr>
            ))}
          </AdminTable>
        </article>

        <article>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-ink">Audit gan day</h2>
              <p className="mt-1 text-sm text-slate-600">Admin actions da sanitize metadata.</p>
            </div>
            <Link className="text-sm font-bold text-ocean hover:text-ink" href="/admin/audit-logs">
              Xem audit
            </Link>
          </div>
          <AdminTable
            empty={data.recent.auditLogs.length === 0}
            headers={["Time", "Role", "Action", "Target", "Severity"]}
          >
            {data.recent.auditLogs.map((log) => (
              <tr key={log.id}>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(log.created_at)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{log.actor_role || "system"}</td>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{log.action}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {log.target_type || "-"} / {log.target_id || "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <AdminStatusBadge value={log.severity || "info"} />
                </td>
              </tr>
            ))}
          </AdminTable>
        </article>

        <article>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-ink">User moi gan day</h2>
              <p className="mt-1 text-sm text-slate-600">Chi hien email va profile summary an toan.</p>
            </div>
            <Link className="text-sm font-bold text-ocean hover:text-ink" href="/admin/users">
              Xem users
            </Link>
          </div>
          <AdminTable empty={data.recent.users.length === 0} headers={["Ngay", "User", "Email"]}>
            {data.recent.users.map((user) => (
              <tr key={user.id}>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(user.createdAt)}</td>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{user.fullName || "Chua co ten"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{user.email || "Chua co email"}</td>
              </tr>
            ))}
          </AdminTable>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-ink">
              <Activity aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-ink">System health</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Provider/env status, audit count va unresolved security count nam trong trang System.
                Trang dashboard chi hien canh bao tom tat de tranh qua tai.
              </p>
              <Link
                className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-ink hover:border-ocean"
                href="/admin/system"
              >
                Mo system health
              </Link>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
