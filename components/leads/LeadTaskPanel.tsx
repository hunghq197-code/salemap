"use client";

import { CalendarPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CompleteTaskModal,
  type CompleteTaskPayload,
} from "@/components/tasks/CompleteTaskModal";
import {
  CreateTaskModal,
  type CreateTaskPayload,
} from "@/components/tasks/CreateTaskModal";
import {
  SnoozeTaskModal,
  type SnoozeTaskPayload,
} from "@/components/tasks/SnoozeTaskModal";
import { TaskCard } from "@/components/tasks/TaskCard";
import { trackEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import type { LeadRecord } from "@/lib/data/leads";
import type { TaskRecord } from "@/lib/data/tasks";

type LeadTaskPanelProps = {
  lead: LeadRecord;
  tasks: TaskRecord[];
};

type ApiResponse<T> = {
  data?: T;
  error?: string;
  success?: boolean;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as ApiResponse<T>;

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error || "Không thể cập nhật task. Vui lòng thử lại.");
  }

  return payload.data;
}

function isOpenTask(task: TaskRecord) {
  return task.status === "pending" || task.status === "snoozed";
}

export function LeadTaskPanel({ lead, tasks }: LeadTaskPanelProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [completingTask, setCompletingTask] = useState<TaskRecord | null>(null);
  const [error, setError] = useState("");
  const [snoozingTask, setSnoozingTask] = useState<TaskRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const openTasks = tasks.filter(isOpenTask);
  const recentCompleted = tasks.filter((task) => !isOpenTask(task)).slice(0, 5);

  async function handleCreateTask(payload: CreateTaskPayload) {
    setSubmitting(true);
    setError("");

    try {
      await parseResponse<TaskRecord>(
        await fetch(`/api/leads/${lead.id}/tasks`, {
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }),
      );
      trackEvent(ANALYTICS_EVENTS.LEAD_FIRST_FOLLOWUP_CREATED, {
        priority: payload.priority,
        source: "lead_detail",
        taskType: payload.taskType,
      });
      setCreateOpen(false);
      router.refresh();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Không thể tạo follow-up.",
      );
    } finally {
      setSubmitting(false);
    }
  }

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
        source: "lead_detail",
        taskType: task.task_type || "follow_up",
      });
      setCompletingTask(null);
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

  async function handleSnoozeTask(task: TaskRecord, payload: SnoozeTaskPayload) {
    setSubmitting(true);
    setError("");

    try {
      await parseResponse<TaskRecord>(
        await fetch(`/api/tasks/${task.id}/snooze`, {
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }),
      );
      trackEvent(ANALYTICS_EVENTS.TASK_SNOOZED, {
        source: "lead_detail",
        taskType: task.task_type || "follow_up",
      });
      setSnoozingTask(null);
      router.refresh();
    } catch (snoozeError) {
      setError(
        snoozeError instanceof Error
          ? snoozeError.message
          : "Không thể dời lịch task.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelTask(task: TaskRecord) {
    if (!window.confirm("Hủy task này?")) return;

    setError("");

    try {
      await parseResponse<TaskRecord>(
        await fetch(`/api/tasks/${task.id}/cancel`, {
          body: JSON.stringify({}),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }),
      );
      trackEvent(ANALYTICS_EVENTS.TASK_CANCELLED, {
        source: "lead_detail",
        taskType: task.task_type || "follow_up",
      });
      router.refresh();
    } catch (cancelError) {
      setError(
        cancelError instanceof Error ? cancelError.message : "Không thể hủy task.",
      );
    }
  }

  return (
    <section
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      id="lead-tasks"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">Việc cần làm</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Theo dõi lịch chăm sóc riêng cho lead này.
          </p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-mint px-4 py-2 text-sm font-bold text-ink hover:bg-[#5de0b3]"
          onClick={() => setCreateOpen(true)}
          type="button"
        >
          <CalendarPlus aria-hidden="true" className="h-4 w-4" />
          Tạo follow-up
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-700">
          {error}
        </div>
      ) : null}

      {openTasks.length > 0 ? (
        <div className="mt-5 space-y-3">
          {openTasks.map((task) => (
            <TaskCard
              key={task.id}
              onCancel={handleCancelTask}
              onComplete={setCompletingTask}
              onSnooze={setSnoozingTask}
              task={task}
            />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-cloud/70 p-5">
          <p className="text-base leading-7 text-slate-600">
            Lead này chưa có lịch chăm sóc.
          </p>
          <button
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg bg-mint px-4 py-2 text-sm font-bold text-ink"
            onClick={() => setCreateOpen(true)}
            type="button"
          >
            Tạo follow-up đầu tiên
          </button>
        </div>
      )}

      {recentCompleted.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-base font-bold text-ink">
            Đã hoàn thành gần đây
          </h3>
          <div className="mt-3 space-y-3">
            {recentCompleted.map((task) => (
              <TaskCard
                key={task.id}
                onCancel={handleCancelTask}
                onComplete={setCompletingTask}
                onSnooze={setSnoozingTask}
                task={task}
              />
            ))}
          </div>
        </div>
      ) : null}

      <CreateTaskModal
        defaultLeadId={lead.id}
        leadOptions={[
          {
            category: lead.category,
            google_maps_url: lead.google_maps_url,
            id: lead.id,
            name: lead.name,
            phone: lead.phone,
            source: lead.source,
            status: lead.status,
          },
        ]}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateTask}
        open={createOpen}
        submitting={submitting}
      />
      <CompleteTaskModal
        onClose={() => setCompletingTask(null)}
        onSubmit={handleCompleteTask}
        open={Boolean(completingTask)}
        submitting={submitting}
        task={completingTask}
      />
      <SnoozeTaskModal
        onClose={() => setSnoozingTask(null)}
        onSubmit={handleSnoozeTask}
        open={Boolean(snoozingTask)}
        submitting={submitting}
        task={snoozingTask}
      />
    </section>
  );
}
