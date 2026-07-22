"use client";

import {
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { LeadStatusBadge } from "@/components/leads/LeadStatusBadge";
import { QuickTaskActions } from "@/components/tasks/QuickTaskActions";
import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import { TaskTypeBadge } from "@/components/tasks/TaskTypeBadge";
import { getTaskStatusLabel } from "@/lib/constants/tasks";
import type { TaskLeadSummary, TaskRecord } from "@/lib/data/tasks";

type TaskCardProps = {
  onCancel: (task: TaskRecord) => void;
  onComplete: (task: TaskRecord) => void;
  onSnooze: (task: TaskRecord) => void;
  task: TaskRecord;
};

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Chưa có lịch";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function getLead(lead?: TaskLeadSummary | TaskLeadSummary[] | null) {
  return Array.isArray(lead) ? lead[0] : lead;
}

function isCompleted(status?: string | null) {
  return status === "completed" || status === "done";
}

export function TaskCard({
  onCancel,
  onComplete,
  onSnooze,
  task,
}: TaskCardProps) {
  const lead = getLead(task.leads);
  const done = isCompleted(task.status);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-ocean/60">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <TaskTypeBadge type={task.task_type} />
            <TaskPriorityBadge priority={task.priority} />
            <span className="inline-flex min-h-7 items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
              {getTaskStatusLabel(task.status)}
            </span>
          </div>

          <h2 className="mt-3 text-lg font-bold leading-7 text-ink">
            {task.title}
          </h2>

          {lead ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm leading-6 text-slate-600">
              <span>Lead:</span>
              <Link
                className="font-bold text-ocean hover:text-ink"
                href={`/app/leads/${lead.id}`}
              >
                {lead.name}
              </Link>
              <LeadStatusBadge status={lead.status} />
              {lead.phone ? <span>{lead.phone}</span> : null}
            </div>
          ) : null}

          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
            <CalendarClock aria-hidden="true" className="h-4 w-4 text-ocean" />
            {formatDateTime(task.remind_at)}
          </p>

          {task.description ? (
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {task.description}
            </p>
          ) : null}

          {task.last_note_summary ? (
            <p className="mt-3 rounded-lg bg-cloud px-3 py-2 text-sm leading-6 text-slate-600">
              Ghi chú gần nhất: {task.last_note_summary}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <QuickTaskActions phone={lead?.phone} />
          {lead ? (
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink hover:border-ocean hover:text-ocean"
              href={`/app/leads/${lead.id}`}
            >
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
              Xem lead
            </Link>
          ) : null}
          {!done && task.status !== "cancelled" ? (
            <>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink hover:border-ocean hover:text-ocean"
                onClick={() => onSnooze(task)}
                type="button"
              >
                <RotateCcw aria-hidden="true" className="h-4 w-4" />
                Dời lịch
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100"
                onClick={() => onCancel(task)}
                type="button"
              >
                <XCircle aria-hidden="true" className="h-4 w-4" />
                Hủy
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-mint px-3 py-2 text-sm font-bold text-ink hover:bg-[#5de0b3]"
                onClick={() => onComplete(task)}
                type="button"
              >
                <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                Hoàn thành
              </button>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}
