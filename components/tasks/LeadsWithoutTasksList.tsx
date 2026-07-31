"use client";

import { CalendarPlus, ExternalLink, Phone } from "lucide-react";
import Link from "next/link";
import { LeadStatusBadge } from "@/components/leads/LeadStatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { LeadWithoutTask } from "@/lib/data/tasks";

type LeadsWithoutTasksListProps = {
  leads: LeadWithoutTask[];
  onCreateTask: (lead: LeadWithoutTask) => void;
};

function formatDate(value?: string | null) {
  if (!value) return "Chưa có";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function LeadsWithoutTasksList({
  leads,
  onCreateTask,
}: LeadsWithoutTasksListProps) {
  if (leads.length === 0) {
    return (
      <div className="mt-5">
        <EmptyState
          description="Các lead active đều đã có lịch chăm sóc tiếp theo."
          title="Không có lead nào bị bỏ quên."
        />
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-4">
      {leads.map((lead) => (
        <article
          className="rounded-card border border-border-soft bg-surface p-4 shadow-card transition hover:border-primary/40 hover:shadow-floating sm:p-5"
          key={lead.id}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold leading-7 text-text-primary">
                  {lead.name}
                </h2>
                <LeadStatusBadge status={lead.status} />
              </div>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Nguồn: {lead.source || "manual"} · Tạo ngày {formatDate(lead.created_at)}
              </p>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-text-secondary">
                {lead.category || lead.address || "Chưa có phân loại/khu vực"}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
              {lead.phone ? (
                <a
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-3 py-2 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
                  href={`tel:${lead.phone}`}
                >
                  <Phone aria-hidden="true" className="h-4 w-4" />
                  Gọi
                </a>
              ) : null}
              <Link
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-3 py-2 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
                href={`/app/leads/${lead.id}`}
              >
                <ExternalLink aria-hidden="true" className="h-4 w-4" />
                Xem lead
              </Link>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-3 py-2 text-sm font-bold text-white shadow-soft transition hover:bg-primary-hover"
                onClick={() => onCreateTask(lead)}
                type="button"
              >
                <CalendarPlus aria-hidden="true" className="h-4 w-4" />
                Tạo follow-up
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
