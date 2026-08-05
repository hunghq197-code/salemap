import { notFound } from "next/navigation";
import { MessageSquareText } from "lucide-react";
import Link from "next/link";
import { SupportChannels } from "@/components/support/SupportChannels";
import { SupportTicketReplyForm } from "@/components/tickets/SupportTicketReplyForm";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupportTicketDetailForUser } from "@/lib/tickets/tickets";

export const dynamic = "force-dynamic";

type SupportTicketDetailPageProps = {
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

export default async function SupportTicketDetailPage(props: SupportTicketDetailPageProps) {
  const { ticketId } = await props.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Card>
        <p className="text-sm font-semibold text-text-secondary">
          Vui lòng đăng nhập để xem ticket hỗ trợ.
        </p>
      </Card>
    );
  }

  const result = await getSupportTicketDetailForUser(ticketId, user.id);

  if (!result) notFound();

  if (!result.schemaReady) {
    return (
      <Card>
        <p className="text-sm font-semibold text-amber-700">
          Ticket schema chưa sẵn sàng. Hãy chạy `supabase/support-tickets.sql`.
        </p>
      </Card>
    );
  }

  if (!result.ticket) notFound();

  const ticket = result.ticket;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link className="text-sm font-bold text-primary hover:text-primary-hover" href="/app/support/tickets">
        Về tickets
      </Link>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
              <MessageSquareText aria-hidden="true" className="h-6 w-6" />
            </span>
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
                {ticket.ticketCode}
              </p>
              <h1 className="mt-2 text-2xl font-bold leading-tight text-text-primary sm:text-3xl">
                {ticket.subject}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary">
                {ticket.description}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="primary">{ticket.status}</Badge>
            <Badge tone={ticket.priority === "urgent" ? "danger" : "neutral"}>
              {ticket.priority}
            </Badge>
          </div>
        </div>
      </Card>

      <SupportChannels compact />

      <section className="space-y-3">
        {ticket.messages.map((message) => (
          <article
            className={[
              "rounded-card border p-4",
              message.authorType === "admin"
                ? "border-primary/20 bg-primary-soft"
                : "border-border-soft bg-surface",
            ].join(" ")}
            key={message.id}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-text-primary">
                {message.authorType === "admin" ? "SaleMap Support" : "Bạn"}
              </p>
              <p className="text-xs font-semibold text-text-muted">
                {formatDate(message.createdAt)}
              </p>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-text-secondary">
              {message.body}
            </p>
          </article>
        ))}
      </section>

      {ticket.status === "closed" || ticket.status === "cancelled" ? null : (
        <Card>
          <SupportTicketReplyForm ticketId={ticket.id} />
        </Card>
      )}
    </div>
  );
}
