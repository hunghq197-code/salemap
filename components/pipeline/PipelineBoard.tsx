"use client";

import { CalendarPlus, Eye, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LEAD_STATUS_OPTIONS } from "@/lib/constants/lead-status";
import type { PipelineColumn } from "@/lib/data/lead-pipeline";

type PipelineBoardProps = {
  columns: PipelineColumn[];
};

function formatDate(value?: string | null) {
  if (!value) return null;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

export function PipelineBoard({ columns }: PipelineBoardProps) {
  const router = useRouter();
  const [pendingLeadId, setPendingLeadId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [followUpLeadId, setFollowUpLeadId] = useState<string | null>(null);

  async function updateStatus(leadId: string, fromStatus: string | null, toStatus: string) {
    if (!toStatus || toStatus === fromStatus) {
      return;
    }

    setPendingLeadId(leadId);
    setMessage(null);

    try {
      const response = await fetch("/api/leads/pipeline/update-status", {
        body: JSON.stringify({ fromStatus, leadId, toStatus }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as
        | { data?: { next_follow_up_at?: string | null }; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(body?.error || "Không thể cập nhật trạng thái.");
      }

      setMessage(
        toStatus === "won"
          ? "Đã chuyển lead sang Đã chốt."
          : "Đã cập nhật trạng thái lead.",
      );

      if (toStatus === "follow_up" && !body?.data?.next_follow_up_at) {
        setFollowUpLeadId(leadId);
      } else {
        setFollowUpLeadId(null);
      }

      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể cập nhật trạng thái.");
    } finally {
      setPendingLeadId(null);
    }
  }

  return (
    <div className="space-y-4">
      {message ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
          {message}
          {followUpLeadId ? (
            <Link
              className="ml-3 inline-flex items-center gap-1 text-ocean hover:text-ink"
              href={`/app/leads/${followUpLeadId}#create-follow-up`}
            >
              <CalendarPlus aria-hidden="true" className="h-4 w-4" />
              Tạo follow-up
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="flex gap-4 overflow-x-auto pb-3">
        {columns.map((column) => (
          <section
            className="min-w-[290px] flex-1 rounded-lg border border-slate-200 bg-white shadow-sm"
            key={column.key}
          >
            <div className="sticky top-0 rounded-t-lg border-b border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-ink">{column.label}</h2>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                    {column.description}
                  </p>
                </div>
                <span className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-full bg-cloud px-2 text-sm font-bold text-ocean">
                  {column.count}
                </span>
              </div>
            </div>

            <div className="space-y-3 p-3">
              {column.leads.length > 0 ? (
                column.leads.map((lead) => (
                  <article
                    className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                    key={lead.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          className="font-bold leading-6 text-ink hover:text-ocean"
                          href={`/app/leads/${lead.id}`}
                        >
                          {lead.name}
                        </Link>
                        <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                          {lead.phone || lead.category || lead.source || "Chưa có thông tin thêm"}
                        </p>
                      </div>
                      <Link
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-ink hover:border-ocean"
                        href={`/app/leads/${lead.id}`}
                      >
                        <Eye aria-hidden="true" className="h-4 w-4" />
                        <span className="sr-only">Xem lead</span>
                      </Link>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                      {lead.priority ? (
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                          {lead.priority}
                        </span>
                      ) : null}
                      {lead.source ? (
                        <span className="rounded-full bg-cloud px-2 py-1 text-slate-600">
                          {lead.source}
                        </span>
                      ) : null}
                      {lead.next_follow_up_at ? (
                        <span className="rounded-full bg-mint/15 px-2 py-1 text-ocean">
                          Follow-up {formatDate(lead.next_follow_up_at)}
                        </span>
                      ) : null}
                    </div>

                    {lead.note_summary ? (
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                        {lead.note_summary}
                      </p>
                    ) : null}

                    <label className="mt-3 block text-xs font-bold text-slate-500">
                      Đổi trạng thái
                      <div className="mt-1 flex items-center gap-2">
                        <select
                          className="min-h-10 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm font-bold text-ink outline-none focus:border-ocean"
                          defaultValue={lead.status || column.key}
                          disabled={pendingLeadId === lead.id}
                          onChange={(event) =>
                            updateStatus(lead.id, lead.status, event.target.value)
                          }
                        >
                          {LEAD_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {pendingLeadId === lead.id ? (
                          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-ocean" />
                        ) : null}
                      </div>
                    </label>
                  </article>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 bg-cloud/60 p-4 text-sm font-semibold leading-6 text-slate-500">
                  {column.emptyText}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
