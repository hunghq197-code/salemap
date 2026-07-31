"use client";

import { CheckCircle2, Clock3, ExternalLink, ListTodo } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CompleteTaskModal,
  type CompleteTaskPayload,
} from "@/components/tasks/CompleteTaskModal";
import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import { TaskTypeBadge } from "@/components/tasks/TaskTypeBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { trackEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import type {
  TaskCounts,
  TaskLeadSummary,
  TaskRecord,
} from "@/lib/data/tasks";

type TodayTasksProps = {
  counts: TaskCounts;
  tasks: TaskRecord[];
};

type ApiResponse<T> = {
  data?: T;
  error?: string;
  success?: boolean;
};

function getLead(lead?: TaskLeadSummary | TaskLeadSummary[] | null) {
  return Array.isArray(lead) ? lead[0] : lead;
}

function formatTime(value?: string | null) {
  if (!value) return "Chưa có giờ";

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function isOverdue(value?: string | null) {
  if (!value) return false;

  return new Date(value).getTime() < Date.now();
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as ApiResponse<T>;

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error || "Không thể cập nhật task.");
  }

  return payload.data;
}

export function TodayTasks({ counts, tasks }: TodayTasksProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [selectedTask, setSelectedTask] = useState<TaskRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCompleteTask(
    task: TaskRecord,
    payload: CompleteTaskPayload,
  ) {
    setSubmitting(true);
    setError("");

    try {
      await parseResponse(
        await fetch(`/api/tasks/${task.id}/complete`, {
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }),
      );
      trackEvent(ANALYTICS_EVENTS.TASK_COMPLETED, {
        hasNextTask: Boolean(payload.createNextTask),
        outcomeType: payload.outcome,
        source: "dashboard",
        taskType: task.task_type || "follow_up",
      });
      setSelectedTask(null);
      router.refresh();
    } catch (completeError) {
      setError(
        completeError instanceof Error
          ? completeError.message
          : "Không thể cập nhật task.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary sm:flex">
            <ListTodo aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
              Ưu tiên hôm nay
            </p>
            <h2 className="mt-1 text-lg font-bold text-text-primary sm:text-xl">
              Việc cần làm hôm nay
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="primary">{counts.today} hôm nay</Badge>
              <Badge tone={counts.overdue > 0 ? "danger" : "success"}>
                {counts.overdue} quá hạn
              </Badge>
              <Badge tone="outline">{counts.leadsWithoutTasks} lead chưa có lịch</Badge>
            </div>
          </div>
        </div>
        <Button href="/app/tasks" size="sm" variant="secondary">
          Xem tất cả
        </Button>
      </div>

      {error ? (
        <div className="mt-4 rounded-control border border-danger/20 bg-danger-soft p-3 text-sm font-semibold leading-6 text-danger">
          {error}
        </div>
      ) : null}

      {tasks.length > 0 ? (
        <div className="mt-4 divide-y divide-border-soft">
          {tasks.slice(0, 7).map((task) => {
            const lead = getLead(task.leads);
            const overdue = isOverdue(task.remind_at);

            return (
              <article className="py-3 first:pt-0 last:pb-0" key={task.id}>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <TaskTypeBadge type={task.task_type} />
                      <TaskPriorityBadge priority={task.priority} />
                      {overdue ? <Badge tone="danger">Quá hạn</Badge> : null}
                    </div>
                    <p className="mt-2 line-clamp-2 font-bold text-text-primary">
                      {task.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-text-secondary sm:text-sm">
                      <span className="min-w-0 truncate">{lead?.name || "Lead"}</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
                        {formatTime(task.remind_at)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                    {lead?.id ? (
                      <Link
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-3 py-2 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
                        href={`/app/leads/${lead.id}`}
                      >
                        <ExternalLink aria-hidden="true" className="h-4 w-4" />
                        Xem lead
                      </Link>
                    ) : null}
                    <button
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-success px-3 py-2 text-sm font-bold text-white transition hover:bg-emerald-600"
                      onClick={() => setSelectedTask(task)}
                      type="button"
                    >
                      <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                      Hoàn thành
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-card border border-dashed border-border-strong bg-surface-muted p-4">
          <p className="font-bold text-text-primary">Hôm nay chưa có việc nào.</p>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Tạo follow-up cho lead mới để SaleMap nhắc bạn đúng thời điểm.
          </p>
          <Button className="mt-4" href="/app/tasks?tab=no_schedule" size="sm">
            Tạo follow-up
          </Button>
        </div>
      )}

      <CompleteTaskModal
        onClose={() => setSelectedTask(null)}
        onSubmit={handleCompleteTask}
        open={Boolean(selectedTask)}
        submitting={submitting}
        task={selectedTask}
      />
    </Card>
  );
}
