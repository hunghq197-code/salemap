import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTicketReplyForm } from "@/components/tickets/AdminTicketReplyForm";
import { AdminTicketUpdateForm } from "@/components/tickets/AdminTicketUpdateForm";
import { getAdminSupportTicketDetail } from "@/lib/tickets/tickets";

export const dynamic = "force-dynamic";

type AdminTicketDetailPageProps = {
  params: Promise<{
    ticketId: string;
  }>;
};

function formatDate(value?: string | null) {
  if (!value) return "Chưa có";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminTicketDetailPage(props: AdminTicketDetailPageProps) {
  const { ticketId } = await props.params;
  const ticket = await getAdminSupportTicketDetail(ticketId);

  if (!ticket) notFound();

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        description="Public reply gửi notification cho user. Internal note chỉ hiển thị trong Admin."
        title={ticket.ticketCode}
      />

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link className="text-sm font-bold text-ocean hover:text-ink" href="/admin/tickets">
              Về tickets
            </Link>
            <h1 className="mt-4 text-2xl font-bold text-ink">{ticket.subject}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              {ticket.description}
            </p>
            <p className="mt-3 font-mono text-xs text-slate-500">{ticket.userId}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminStatusBadge value={ticket.status} />
            <AdminStatusBadge value={ticket.priority} />
            {ticket.category ? <AdminStatusBadge value={ticket.category.name} /> : null}
          </div>
        </div>

        <div className="mt-6 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
          <p>
            <span className="font-bold text-ink">First response due:</span>{" "}
            {formatDate(ticket.firstResponseDueAt)}
          </p>
          <p>
            <span className="font-bold text-ink">Resolution due:</span>{" "}
            {formatDate(ticket.resolutionDueAt)}
          </p>
          <p>
            <span className="font-bold text-ink">Last message:</span>{" "}
            {formatDate(ticket.lastMessageAt)}
          </p>
          <p>
            <span className="font-bold text-ink">Assigned:</span>{" "}
            {ticket.assignedAdminId || "unassigned"}
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-ink">Workflow</h2>
        <AdminTicketUpdateForm
          assignedAdminId={ticket.assignedAdminId}
          priority={ticket.priority}
          status={ticket.status}
          ticketId={ticket.id}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-3">
          {ticket.messages.map((message) => (
            <article
              className={[
                "rounded-lg border p-4 shadow-sm",
                message.visibility === "internal"
                  ? "border-amber-200 bg-amber-50"
                  : message.authorType === "admin"
                    ? "border-ocean/20 bg-ocean/5"
                    : "border-slate-200 bg-white",
              ].join(" ")}
              key={message.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-ink">{message.authorType}</p>
                  <AdminStatusBadge value={message.visibility} />
                </div>
                <p className="text-xs font-semibold text-slate-500">
                  {formatDate(message.createdAt)}
                </p>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {message.body}
              </p>
            </article>
          ))}
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-ink">Reply</h2>
          <AdminTicketReplyForm ticketId={ticket.id} />
        </aside>
      </section>
    </div>
  );
}
