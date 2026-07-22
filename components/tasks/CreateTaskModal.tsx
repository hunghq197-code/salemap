"use client";

import { CalendarPlus, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import {
  DEFAULT_TASK_SUGGESTIONS,
  TASK_PRIORITY,
  TASK_TYPES,
  type TaskPriority,
  type TaskType,
} from "@/lib/constants/tasks";
import type { TaskLeadSummary } from "@/lib/data/tasks";

export type CreateTaskPayload = {
  dueAt: string;
  leadId: string;
  note?: string;
  priority: TaskPriority;
  taskType: TaskType;
  title?: string;
};

type CreateTaskModalProps = {
  defaultLeadId?: string | null;
  leadOptions: TaskLeadSummary[];
  onClose: () => void;
  onSubmit: (payload: CreateTaskPayload) => Promise<void>;
  open: boolean;
  submitting?: boolean;
};

function toLocalInputValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function quickDate(kind: "today" | "tomorrow" | "three_days" | "week") {
  const date = new Date();

  if (kind === "today") {
    date.setHours(Math.max(date.getHours() + 2, 9), 0, 0, 0);
  } else if (kind === "tomorrow") {
    date.setDate(date.getDate() + 1);
    date.setHours(9, 0, 0, 0);
  } else if (kind === "three_days") {
    date.setDate(date.getDate() + 3);
    date.setHours(9, 0, 0, 0);
  } else {
    date.setDate(date.getDate() + 7);
    date.setHours(9, 0, 0, 0);
  }

  return toLocalInputValue(date);
}

export function CreateTaskModal({
  defaultLeadId,
  leadOptions,
  onClose,
  onSubmit,
  open,
  submitting = false,
}: CreateTaskModalProps) {
  if (!open) {
    return null;
  }

  return (
    <CreateTaskModalForm
      defaultLeadId={defaultLeadId}
      key={defaultLeadId || leadOptions[0]?.id || "task"}
      leadOptions={leadOptions}
      onClose={onClose}
      onSubmit={onSubmit}
      submitting={submitting}
    />
  );
}

function CreateTaskModalForm({
  defaultLeadId,
  leadOptions,
  onClose,
  onSubmit,
  submitting = false,
}: Omit<CreateTaskModalProps, "open">) {
  const [dueAt, setDueAt] = useState(quickDate("tomorrow"));
  const [leadId, setLeadId] = useState(defaultLeadId || "");
  const [note, setNote] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [taskType, setTaskType] = useState<TaskType>("call");
  const [title, setTitle] = useState("");
  const defaultLead = useMemo(
    () => leadOptions.find((lead) => lead.id === leadId),
    [leadId, leadOptions],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      dueAt,
      leadId,
      note: note.trim() || undefined,
      priority,
      taskType,
      title: title.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end bg-ink/40 px-3 pb-3 pt-10 sm:items-center sm:justify-center sm:p-6">
      <form
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-ink">Tạo việc cần làm</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Lên lịch chăm sóc tiếp theo để không bỏ quên lead mới.
            </p>
          </div>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
            <span className="sr-only">Đóng</span>
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-ink">
            Lead
            <select
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              disabled={Boolean(defaultLeadId)}
              onChange={(event) => setLeadId(event.target.value)}
              required
              value={leadId}
            >
              <option value="">Chọn lead</option>
              {leadOptions.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-bold text-ink">
            Loại việc
            <select
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              onChange={(event) => setTaskType(event.target.value as TaskType)}
              value={taskType}
            >
              {TASK_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-4 block text-sm font-bold text-ink">
          Tiêu đề
          <input
            className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
            maxLength={120}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={
              defaultLead ? `Gọi lần đầu ${defaultLead.name}` : "Gọi lần đầu"
            }
            value={title}
          />
        </label>

        <div className="mt-4">
          <p className="text-sm font-bold text-ink">Gợi ý nhanh</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DEFAULT_TASK_SUGGESTIONS.map((suggestion) => (
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 hover:border-ocean hover:text-ocean"
                key={suggestion}
                onClick={() => setTitle(suggestion)}
                type="button"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-ink">
            Ngày giờ cần làm
            <input
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              onChange={(event) => setDueAt(event.target.value)}
              required
              type="datetime-local"
              value={dueAt}
            />
          </label>

          <label className="text-sm font-bold text-ink">
            Priority
            <select
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              onChange={(event) => setPriority(event.target.value as TaskPriority)}
              value={priority}
            >
              {TASK_PRIORITY.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Hôm nay", value: "today" },
            { label: "Ngày mai", value: "tomorrow" },
            { label: "Sau 3 ngày", value: "three_days" },
            { label: "Tuần sau", value: "week" },
          ].map((item) => (
            <button
              className="min-h-10 rounded-lg border border-slate-200 bg-cloud px-3 py-2 text-sm font-bold text-slate-700 hover:border-ocean hover:bg-white"
              key={item.value}
              onClick={() =>
                setDueAt(
                  quickDate(item.value as "today" | "tomorrow" | "three_days" | "week"),
                )
              }
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-sm font-bold text-ink">
          Ghi chú thêm
          <textarea
            className="mt-2 min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-base leading-7 text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
            maxLength={2000}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Nội dung cần chuẩn bị trước khi liên hệ"
            value={note}
          />
        </label>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink hover:border-ocean"
            onClick={onClose}
            type="button"
          >
            Để sau
          </button>
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink hover:bg-[#5de0b3] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={submitting || !leadId}
            type="submit"
          >
            <CalendarPlus aria-hidden="true" className="h-5 w-5" />
            {submitting ? "Đang tạo..." : "Tạo việc cần làm"}
          </button>
        </div>
      </form>
    </div>
  );
}
