import { AlertTriangle, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { getAdminSupportTickets } from "@/lib/tickets/tickets";

export const dynamic = "force-dynamic";

function formatDate(value?: string | null) {
  if (!value) return "Chưa có";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminTicketsPage() {
  const tickets = await getAdminSupportTickets();
  const openCount = tickets.items.filter(
    (ticket) => !["resolved", "closed", "cancelled"].includes(ticket.status),
  ).length;
  const breachedCount = tickets.items.filter(
    (ticket) => ticket.firstResponseBreached || ticket.resolutionBreached,
  ).length;

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Queue hỗ trợ khách hàng SaleMap, tách khỏi beta feedback và không đọc dữ liệu lead riêng tư."
        title="Support Tickets"
      />

      {!tickets.schemaReady ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Ticket schema chưa sẵn sàng. Hãy chạy `supabase/support-tickets.sql`.
        </div>
      ) : null}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard icon={<MessageSquareText className="h-5 w-5" />} label="Ticket mở" value={openCount} />
        <AdminKpiCard icon={<AlertTriangle className="h-5 w-5" />} label="SLA quá hạn" value={breachedCount} />
      </section>

      <section className="mt-6">
        <AdminTable
          empty={tickets.items.length === 0}
          headers={["Ngày", "Ticket", "Customer", "Status", "Priority", "SLA", "Assignee", "Detail"]}
        >
          {tickets.items.map((ticket) => (
            <tr key={ticket.id}>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {formatDate(ticket.createdAt)}
              </td>
              <td className="min-w-[220px] px-4 py-3">
                <p className="font-bold text-ink">{ticket.subject}</p>
                <p className="mt-1 font-mono text-xs text-slate-500">{ticket.ticketCode}</p>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                {ticket.userLabel || ticket.userId}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <AdminStatusBadge value={ticket.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <AdminStatusBadge value={ticket.priority} />
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                {ticket.firstResponseBreached || ticket.resolutionBreached ? (
                  <AdminStatusBadge tone="red" value="breached" />
                ) : (
                  <AdminStatusBadge tone="green" value="ok" />
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">
                {ticket.assignedAdminId || "unassigned"}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <Link className="font-bold text-ocean hover:text-ink" href={`/admin/tickets/${ticket.id}`}>
                  Mở
                </Link>
              </td>
            </tr>
          ))}
        </AdminTable>
      </section>
    </div>
  );
}
