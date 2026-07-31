"use client";

import { CheckCircle2, ListTodo } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CompleteTaskModal,
  type CompleteTaskPayload,
} from "@/components/tasks/CompleteTaskModal";
import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import { TaskTypeBadge } from "@/components/tasks/TaskTypeBadge";
import { trackEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import type {
  TaskCounts,
  TaskLeadSummary,
  TaskRecord,
} from "@/lib/data/tasks";

type TodayTasksWidgetProps = {
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

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as ApiResponse<T>;

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error || "Không thể cập nhật task.");
  }

  return payload.data;
}

export function TodayTasksWidget({ counts, tasks }: TodayTasksWidgetProps) {
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
    <section className="mt-4 rounded-card border border-border-soft bg-surface p-4 shadow-card sm:mt-6 sm:p-5 lg:mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary sm:flex">
            <ListTodo aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-text-primary sm:text-xl">
              Việc cần làm hôm nay
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex min-h-7 items-center rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
                {counts.today} hôm nay
              </span>
              <span className="inline-flex min-h-7 items-center rounded-full border border-danger/20 bg-danger-soft px-3 py-1 text-xs font-bold text-danger">
                {counts.overdue} quá hạn
              </span>
              <span className="inline-flex min-h-7 items-center rounded-full border border-border-soft bg-surface-muted px-3 py-1 text-xs font-bold text-text-secondary">
                {counts.leadsWithoutTasks} lead chưa có lịch
              </span>
            </div>
          </div>
        </div>
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-control bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ocean sm:min-h-11"
          href="/app/tasks"
        >
          Xem việc cần làm
        </Link>
      </div>

      {error ? (
        <div className="mt-4 rounded-control border border-rose-200 bg-rose-50 p-3 text-sm font-semibold leading-6 text-rose-700 sm:p-4">
          {error}
        </div>
      ) : null}

      {tasks.length > 0 ? (
        <div className="mt-4 space-y-3 sm:mt-5">
          {tasks.slice(0, 3).map((task) => {
            const lead = getLead(task.leads);

            return (
              <article
                className="rounded-card border border-border-soft bg-surface-muted/70 p-3 sm:p-4"
                key={task.id}
              >
                <div className="flex flex-col gap-3 min-[390px]:flex-row min-[390px]:items-center min-[390px]:justify-between sm:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <TaskTypeBadge type={task.task_type} />
                      <TaskPriorityBadge priority={task.priority} />
                    </div>
                    <p className="mt-3 line-clamp-2 font-bold text-text-primary">
                      {task.title}
                    </p>
                    <p className="mt-1 truncate text-xs font-semibold text-text-secondary sm:text-sm">
                      {lead?.name || "Lead"} · {formatTime(task.remind_at)}
                    </p>
                  </div>
                  <button
                    className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-control bg-success px-3 py-2 text-sm font-bold text-white hover:bg-emerald-600 sm:min-h-11"
                    onClick={() => setSelectedTask(task)}
                    type="button"
                  >
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                    Hoàn thành
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-card border border-dashed border-border-strong bg-surface-muted p-4 sm:mt-5 sm:p-5">
          <p className="text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
            Không có việc nào hôm nay. Hãy tạo follow-up cho lead mới.
          </p>
          <Link
            className="mt-3 inline-flex min-h-10 items-center justify-center rounded-control bg-success px-4 py-2 text-sm font-bold text-white sm:min-h-11"
            href="/app/tasks?tab=no_schedule"
          >
            Xem lead chưa có lịch
          </Link>
        </div>
      )}

      <CompleteTaskModal
        onClose={() => setSelectedTask(null)}
        onSubmit={handleCompleteTask}
        open={Boolean(selectedTask)}
        submitting={submitting}
        task={selectedTask}
      />
    </section>
  );
}
