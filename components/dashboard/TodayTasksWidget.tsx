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
    <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-mint/15 text-ocean">
            <ListTodo aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-ink">
              Việc cần làm hôm nay
            </h2>
            <p className="mt-2 text-base leading-7 text-slate-600">
              {counts.today} task hôm nay · {counts.overdue} quá hạn ·{" "}
              {counts.leadsWithoutTasks} lead chưa có lịch
            </p>
          </div>
        </div>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ocean"
          href="/app/tasks"
        >
          Xem việc cần làm
        </Link>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-700">
          {error}
        </div>
      ) : null}

      {tasks.length > 0 ? (
        <div className="mt-5 space-y-3">
          {tasks.slice(0, 3).map((task) => {
            const lead = getLead(task.leads);

            return (
              <article
                className="rounded-lg border border-slate-200 bg-cloud/60 p-4"
                key={task.id}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <TaskTypeBadge type={task.task_type} />
                      <TaskPriorityBadge priority={task.priority} />
                    </div>
                    <p className="mt-3 font-bold text-ink">{task.title}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      {lead?.name || "Lead"} · {formatTime(task.remind_at)}
                    </p>
                  </div>
                  <button
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-mint px-3 py-2 text-sm font-bold text-ink hover:bg-[#5de0b3]"
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
        <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-cloud/70 p-5">
          <p className="text-base leading-7 text-slate-600">
            Không có việc nào hôm nay. Hãy tạo follow-up cho lead mới.
          </p>
          <Link
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg bg-mint px-4 py-2 text-sm font-bold text-ink"
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
