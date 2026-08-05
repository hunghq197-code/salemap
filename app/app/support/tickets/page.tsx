import { MessageSquareText, PlusCircle } from "lucide-react";
import Link from "next/link";
import { SupportChannels } from "@/components/support/SupportChannels";
import { SupportTicketCreateForm } from "@/components/tickets/SupportTicketCreateForm";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSupportTicketCategories,
  getSupportTicketsForUser,
} from "@/lib/tickets/tickets";

export const dynamic = "force-dynamic";

function formatDate(value?: string | null) {
  if (!value) return "Chưa có";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusTone(status: string) {
  if (["resolved", "closed"].includes(status)) return "success" as const;
  if (["cancelled"].includes(status)) return "danger" as const;
  if (["waiting_on_customer"].includes(status)) return "warning" as const;
  return "primary" as const;
}

export default async function SupportTicketsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Card>
        <p className="text-sm font-semibold text-text-secondary">
          Vui lòng đăng nhập để tạo ticket hỗ trợ.
        </p>
      </Card>
    );
  }

  const [categories, tickets] = await Promise.all([
    getSupportTicketCategories(),
    getSupportTicketsForUser(user.id),
  ]);
  const schemaReady = categories.schemaReady && tickets.schemaReady;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
            <MessageSquareText aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Support
            </p>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
              Ticket hỗ trợ
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-8 text-text-secondary">
              Tạo ticket khi bạn cần hỗ trợ về tài khoản, thanh toán hoặc lỗi sản phẩm.
            </p>
          </div>
        </div>
      </div>

      <SupportChannels />

      {!schemaReady ? (
        <Card>
          <p className="text-sm font-semibold text-amber-700">
            Ticket schema chưa sẵn sàng. Hãy chạy `supabase/support-tickets.sql`.
          </p>
        </Card>
      ) : null}

      <Card>
        <div className="mb-5 flex items-center gap-3">
          <PlusCircle aria-hidden="true" className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-text-primary">Tạo ticket mới</h2>
        </div>
        <SupportTicketCreateForm categories={categories.items} />
      </Card>

      <section className="grid gap-4 md:grid-cols-2">
        {tickets.items.map((ticket) => (
          <Link
            className="block rounded-card border border-border-soft bg-surface p-4 shadow-sm transition hover:border-primary/40"
            href={`/app/support/tickets/${ticket.id}`}
            key={ticket.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs font-bold text-text-muted">
                  {ticket.ticketCode}
                </p>
                <h2 className="mt-2 text-lg font-bold text-text-primary">
                  {ticket.subject}
                </h2>
              </div>
              <Badge tone={statusTone(ticket.status)}>{ticket.status}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone={ticket.priority === "urgent" ? "danger" : "neutral"}>
                {ticket.priority}
              </Badge>
              {ticket.firstResponseBreached || ticket.resolutionBreached ? (
                <Badge tone="danger">SLA</Badge>
              ) : null}
            </div>
            <p className="mt-4 text-sm font-semibold text-text-secondary">
              Cập nhật: {formatDate(ticket.lastMessageAt)}
            </p>
          </Link>
        ))}
      </section>

      {tickets.items.length === 0 ? (
        <Card>
          <p className="text-center text-sm font-semibold text-text-muted">
            Chưa có ticket hỗ trợ.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
