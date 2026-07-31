import { Clock3, ExternalLink, Phone, UserRoundCheck } from "lucide-react";
import Link from "next/link";
import { LeadStatusBadge } from "@/components/leads/LeadStatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type {
  TaskLeadSummary,
  TaskRecord,
} from "@/lib/data/tasks";

type RecentLead = {
  address: string | null;
  category: string | null;
  id: string;
  name: string;
  phone?: string | null;
  status: string | null;
};

type LeadsRequiringAttentionProps = {
  recentLeads: RecentLead[];
  tasks: TaskRecord[];
};

type AttentionLead = {
  href: string;
  id: string;
  name: string;
  nextFollowUp?: string | null;
  phone?: string | null;
  reason: string;
  status?: string | null;
};

function getLead(lead?: TaskLeadSummary | TaskLeadSummary[] | null) {
  return Array.isArray(lead) ? lead[0] : lead;
}

function formatDateTime(value?: string | null) {
  if (!value) return "Chưa có lịch";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

function buildAttentionLeads(tasks: TaskRecord[], recentLeads: RecentLead[]) {
  const seen = new Set<string>();
  const items: AttentionLead[] = [];

  [...tasks]
    .sort((a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime())
    .forEach((task) => {
      const lead = getLead(task.leads);
      if (!lead?.id || seen.has(lead.id)) return;

      seen.add(lead.id);
      const overdue = new Date(task.remind_at).getTime() < Date.now();
      items.push({
        href: `/app/leads/${lead.id}`,
        id: lead.id,
        name: lead.name,
        nextFollowUp: task.remind_at,
        phone: lead.phone,
        reason: overdue ? "Follow-up quá hạn" : "Có lịch chăm sóc hôm nay",
        status: lead.status,
      });
    });

  recentLeads.forEach((lead) => {
    if (seen.has(lead.id)) return;

    seen.add(lead.id);
    items.push({
      href: `/app/leads/${lead.id}`,
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      reason: "Lead mới lưu gần đây",
      status: lead.status,
    });
  });

  return items.slice(0, 5);
}

export function LeadsRequiringAttention({
  recentLeads,
  tasks,
}: LeadsRequiringAttentionProps) {
  const leads = buildAttentionLeads(tasks, recentLeads);

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
            Cần chú ý
          </p>
          <h2 className="mt-1 text-lg font-bold text-text-primary sm:text-xl">
            Lead nên chăm sóc tiếp
          </h2>
        </div>
        <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-control bg-accent-soft text-cyan-700 sm:flex">
          <UserRoundCheck aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>

      {leads.length > 0 ? (
        <div className="mt-4 divide-y divide-border-soft">
          {leads.map((lead) => (
            <article className="py-3 first:pt-0 last:pb-0" key={lead.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      className="truncate font-bold text-text-primary hover:text-primary"
                      href={lead.href}
                    >
                      {lead.name}
                    </Link>
                    <LeadStatusBadge status={lead.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-text-secondary">
                    <Badge tone={lead.reason.includes("quá hạn") ? "danger" : "primary"}>
                      {lead.reason}
                    </Badge>
                    {lead.nextFollowUp ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
                        {formatDateTime(lead.nextFollowUp)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex gap-2">
                  {lead.phone ? (
                    <a
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-3 py-2 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
                      href={`tel:${lead.phone}`}
                    >
                      <Phone aria-hidden="true" className="h-4 w-4" />
                      Gọi
                    </a>
                  ) : null}
                  <Link
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-3 py-2 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
                    href={lead.href}
                  >
                    <ExternalLink aria-hidden="true" className="h-4 w-4" />
                    Xem
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-card border border-dashed border-border-strong bg-surface-muted p-4">
          <p className="font-bold text-text-primary">
            Bắt đầu xây dựng danh sách khách hàng
          </p>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Tìm khách quanh khu vực, lưu lead và tạo lịch chăm sóc để SaleMap hỗ trợ công việc mỗi ngày.
          </p>
          <Link
            className="mt-4 inline-flex min-h-10 items-center justify-center rounded-control bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-hover"
            href="/app/discover"
            prefetch={false}
          >
            Tìm khách đầu tiên
          </Link>
        </div>
      )}
    </Card>
  );
}
