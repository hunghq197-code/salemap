"use client";

import { CalendarPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { TaskCounts } from "@/components/tasks/TaskCounts";
import { FirstRunTip } from "@/components/onboarding/FirstRunTip";
import {
  CreateTaskModal,
  type CreateTaskPayload,
} from "@/components/tasks/CreateTaskModal";
import {
  CompleteTaskModal,
  type CompleteTaskPayload,
} from "@/components/tasks/CompleteTaskModal";
import {
  LeadsWithoutTasksList,
} from "@/components/tasks/LeadsWithoutTasksList";
import {
  SnoozeTaskModal,
  type SnoozeTaskPayload,
} from "@/components/tasks/SnoozeTaskModal";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskTabs } from "@/components/tasks/TaskTabs";
import type { TaskTab } from "@/lib/constants/tasks";
import type {
  LeadWithoutTask,
  TaskCounts as TaskCountsData,
  TaskLeadSummary,
  TaskRecord,
} from "@/lib/data/tasks";

type TaskCenterPageProps = {
  activeTab: TaskTab;
  counts: TaskCountsData;
  leadOptions: TaskLeadSummary[];
  leadsWithoutTasks: LeadWithoutTask[];
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

export function TaskCenterPage({
  activeTab,
  counts,
  leadOptions,
  leadsWithoutTasks,
  tasks,
}: TaskCenterPageProps) {
  const router = useRouter();
  const [createLeadId, setCreateLeadId] = useState<string | null>(null);
  const [completingTask, setCompletingTask] = useState<TaskRecord | null>(null);
  const [error, setError] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [snoozingTask, setSnoozingTask] = useState<TaskRecord | null>(null);
  const createModalOpen = createLeadId !== null;

  useEffect(() => {
    trackEvent(ANALYTICS_EVENTS.TASK_CENTER_VIEWED, {
      tab: activeTab,
    });
  }, [activeTab]);

  function refreshAfterMutation() {
    router.refresh();
  }

  async function handleCreateTask(payload: CreateTaskPayload) {
    setModalSubmitting(true);
    setError("");

    try {
      await parseResponse<TaskRecord>(
        await fetch("/api/tasks", {
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }),
      );
      trackEvent(ANALYTICS_EVENTS.TASK_CREATED, {
        priority: payload.priority,
        source: activeTab,
        taskType: payload.taskType,
      });
      setCreateLeadId(null);
      refreshAfterMutation();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Không thể tạo việc cần làm. Vui lòng thử lại.",
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  async function handleCompleteTask(
    task: TaskRecord,
    payload: CompleteTaskPayload,
  ) {
    setModalSubmitting(true);
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
        leadStatusAfter: payload.nextStatus,
        outcomeType: payload.outcome,
        priority: task.priority || "medium",
        source: activeTab,
        taskType: task.task_type || "follow_up",
      });
      setCompletingTask(null);
      refreshAfterMutation();
    } catch (completeError) {
      setError(
        completeError instanceof Error
          ? completeError.message
          : "Không thể cập nhật task. Vui lòng thử lại.",
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  async function handleSnoozeTask(task: TaskRecord, payload: SnoozeTaskPayload) {
    setModalSubmitting(true);
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
        priority: task.priority || "medium",
        source: activeTab,
        taskType: task.task_type || "follow_up",
      });
      setSnoozingTask(null);
      refreshAfterMutation();
    } catch (snoozeError) {
      setError(
        snoozeError instanceof Error
          ? snoozeError.message
          : "Không thể dời lịch task. Vui lòng thử lại.",
      );
    } finally {
      setModalSubmitting(false);
    }
  }

  async function handleCancelTask(task: TaskRecord) {
    if (!window.confirm("Hủy task này?")) {
      return;
    }

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
        priority: task.priority || "medium",
        source: activeTab,
        taskType: task.task_type || "follow_up",
      });
      refreshAfterMutation();
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : "Không thể hủy task. Vui lòng thử lại.",
      );
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        actions={
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-primary px-5 py-3 text-base font-bold text-white shadow-soft hover:bg-primary-hover"
          onClick={() => setCreateLeadId("")}
          type="button"
        >
          <CalendarPlus aria-hidden="true" className="h-5 w-5" />
          Tạo việc cần làm
        </button>
        }
        description={`Theo dõi cuộc gọi, tin nhắn, follow-up và lịch chăm sóc khách hàng. Hôm nay có ${counts.today} việc, ${counts.overdue} việc quá hạn.`}
        eyebrow="Task center"
        fullBleed
        title="Việc cần làm"
      >
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="warning">{counts.today} hôm nay</Badge>
          <Badge tone={counts.overdue > 0 ? "danger" : "success"}>
            {counts.overdue} quá hạn
          </Badge>
          <Badge tone="primary">{counts.upcoming} sắp tới</Badge>
        </div>
      </PageHeader>

      <TaskCounts counts={counts} />
      <FirstRunTip
        message="Mỗi sáng chỉ cần mở Việc cần làm để biết hôm nay cần gọi ai, nhắn ai, theo dõi ai."
        storageKey="salemap:first-run-tip:tasks"
      />
      <TaskTabs activeTab={activeTab} counts={counts} />

      {error ? (
        <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-700">
          {error}
        </div>
      ) : null}

      {activeTab === "no_schedule" ? (
        <LeadsWithoutTasksList
          leads={leadsWithoutTasks}
          onCreateTask={(lead) => setCreateLeadId(lead.id)}
        />
      ) : (
        <TaskList
          activeTab={activeTab}
          onCancel={handleCancelTask}
          onComplete={setCompletingTask}
          onSnooze={setSnoozingTask}
          tasks={tasks}
        />
      )}

      <CreateTaskModal
        defaultLeadId={createLeadId || undefined}
        leadOptions={leadOptions}
        onClose={() => setCreateLeadId(null)}
        onSubmit={handleCreateTask}
        open={createModalOpen}
        submitting={modalSubmitting}
      />
      <CompleteTaskModal
        onClose={() => setCompletingTask(null)}
        onSubmit={handleCompleteTask}
        open={Boolean(completingTask)}
        submitting={modalSubmitting}
        task={completingTask}
      />
      <SnoozeTaskModal
        onClose={() => setSnoozingTask(null)}
        onSubmit={handleSnoozeTask}
        open={Boolean(snoozingTask)}
        submitting={modalSubmitting}
        task={snoozingTask}
      />
    </div>
  );
}
