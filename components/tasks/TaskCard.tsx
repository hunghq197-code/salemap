"use client";

import {
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  ListChecks,
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

function isOverdue(value?: string | null) {
  return Boolean(value && new Date(value).getTime() < Date.now());
}

export function TaskCard({
  onCancel,
  onComplete,
  onSnooze,
  task,
}: TaskCardProps) {
  const lead = getLead(task.leads);
  const done = isCompleted(task.status);
  const overdue = !done && task.status !== "cancelled" && isOverdue(task.remind_at);

  return (
    <article
      className={[
        "rounded-card border bg-surface p-4 shadow-card transition duration-150 hover:shadow-floating",
        overdue ? "border-danger/35" : "border-border-soft hover:border-primary/40",
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <TaskTypeBadge type={task.task_type} />
            <TaskPriorityBadge priority={task.priority} />
            <span className="inline-flex min-h-7 items-center rounded-full border border-border-soft bg-surface-muted px-3 py-1 text-xs font-bold text-text-secondary">
              {getTaskStatusLabel(task.status)}
            </span>
            {task.cadence ? (
              <span className="inline-flex min-h-7 items-center gap-1 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
                <ListChecks aria-hidden="true" className="h-3.5 w-3.5" />
                Từ quy trình
              </span>
            ) : null}
            {overdue ? (
              <span className="inline-flex min-h-7 items-center rounded-full border border-danger/20 bg-danger-soft px-3 py-1 text-xs font-bold text-danger">
                Cần xử lý trước
              </span>
            ) : null}
          </div>

          <h2 className="mt-3 text-lg font-bold leading-7 text-text-primary">
            {task.title}
          </h2>

          {lead ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm leading-6 text-text-secondary">
              <span>Lead:</span>
              <Link
                className="font-bold text-primary hover:text-text-primary"
                href={`/app/leads/${lead.id}`}
              >
                {lead.name}
              </Link>
              <LeadStatusBadge status={lead.status} />
              {lead.phone ? <span>{lead.phone}</span> : null}
            </div>
          ) : null}

          <p
            className={[
              "mt-3 flex items-center gap-2 text-sm font-semibold",
              overdue ? "text-danger" : "text-text-secondary",
            ].join(" ")}
          >
            <CalendarClock aria-hidden="true" className="h-4 w-4" />
            {formatDateTime(task.remind_at)}
          </p>

          {task.description ? (
            <p className="mt-3 text-sm leading-7 text-text-secondary">
              {task.description}
            </p>
          ) : null}

          {task.cadence ? (
            <p className="mt-3 rounded-control border border-primary/15 bg-primary-soft px-3 py-2 text-sm font-semibold leading-6 text-primary">
              {task.cadence.templateName} · Bước {task.cadence.stepOrder}/
              {task.cadence.totalSteps || "?"}
            </p>
          ) : null}

          {task.last_note_summary ? (
            <p className="mt-3 rounded-control bg-surface-muted px-3 py-2 text-sm leading-6 text-text-secondary">
              Ghi chú gần nhất: {task.last_note_summary}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <QuickTaskActions phone={lead?.phone} />
          {lead ? (
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-3 py-2 text-sm font-bold text-text-primary hover:border-primary/40 hover:text-primary"
              href={`/app/leads/${lead.id}`}
            >
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
              Xem lead
            </Link>
          ) : null}
          {!done && task.status !== "cancelled" ? (
            <>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-3 py-2 text-sm font-bold text-text-primary hover:border-primary/40 hover:text-primary"
                onClick={() => onSnooze(task)}
                type="button"
              >
                <RotateCcw aria-hidden="true" className="h-4 w-4" />
                Dời lịch
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-danger/20 bg-danger-soft px-3 py-2 text-sm font-bold text-danger hover:bg-red-100"
                onClick={() => onCancel(task)}
                type="button"
              >
                <XCircle aria-hidden="true" className="h-4 w-4" />
                Hủy
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-success px-3 py-2 text-sm font-bold text-white hover:bg-emerald-600"
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
