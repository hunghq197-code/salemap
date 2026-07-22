"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { TaskCard } from "@/components/tasks/TaskCard";
import type { TaskTab } from "@/lib/constants/tasks";
import type { TaskRecord } from "@/lib/data/tasks";

type TaskListProps = {
  activeTab: TaskTab;
  onCancel: (task: TaskRecord) => void;
  onComplete: (task: TaskRecord) => void;
  onSnooze: (task: TaskRecord) => void;
  tasks: TaskRecord[];
};

function getEmptyCopy(tab: TaskTab) {
  if (tab === "overdue") {
    return {
      body: "Các việc quá hạn sẽ nằm ở đây để bạn xử lý trước.",
      title: "Không có việc quá hạn. Rất tốt!",
    };
  }

  if (tab === "upcoming") {
    return {
      body: "Tạo follow-up từ lead detail hoặc từ nút Tạo việc cần làm.",
      title: "Chưa có việc sắp tới.",
    };
  }

  if (tab === "completed") {
    return {
      body: "Khi bạn hoàn thành follow-up, lịch sử sẽ được lưu tại đây.",
      title: "Chưa có việc đã hoàn thành.",
    };
  }

  return {
    body: "Hãy tạo follow-up cho lead mới hoặc kiểm tra tab Chưa có lịch.",
    title: "Hôm nay bạn chưa có việc cần làm.",
  };
}

export function TaskList({
  activeTab,
  onCancel,
  onComplete,
  onSnooze,
  tasks,
}: TaskListProps) {
  if (tasks.length === 0) {
    const copy = getEmptyCopy(activeTab);

    return (
      <div className="mt-5">
        <EmptyState description={copy.body} title={copy.title} />
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-4">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          onCancel={onCancel}
          onComplete={onComplete}
          onSnooze={onSnooze}
          task={task}
        />
      ))}
    </div>
  );
}
