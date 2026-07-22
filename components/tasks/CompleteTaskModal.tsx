"use client";

import { CheckCircle2, Clipboard, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { LEAD_STATUS_OPTIONS, type LeadStatus } from "@/lib/constants/lead-status";
import {
  TASK_OUTCOMES,
  TASK_TYPES,
  type TaskOutcome,
  type TaskType,
} from "@/lib/constants/tasks";
import type { TaskLeadSummary, TaskRecord } from "@/lib/data/tasks";

export type CompleteTaskPayload = {
  createNextTask?: {
    dueAt: string;
    taskType: TaskType;
    title?: string;
  };
  nextStatus?: LeadStatus;
  note?: string;
  outcome?: TaskOutcome;
};

type CompleteTaskModalProps = {
  onClose: () => void;
  onSubmit: (task: TaskRecord, payload: CompleteTaskPayload) => Promise<void>;
  open: boolean;
  submitting?: boolean;
  task?: TaskRecord | null;
};

function getLead(lead?: TaskLeadSummary | TaskLeadSummary[] | null) {
  return Array.isArray(lead) ? lead[0] : lead;
}

function toLocalInputValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function quickDate(kind: "none" | "tomorrow" | "three_days" | "week") {
  if (kind === "none") return "";

  const date = new Date();

  if (kind === "tomorrow") {
    date.setDate(date.getDate() + 1);
  } else if (kind === "three_days") {
    date.setDate(date.getDate() + 3);
  } else {
    date.setDate(date.getDate() + 7);
  }

  date.setHours(9, 0, 0, 0);
  return toLocalInputValue(date);
}

export function CompleteTaskModal({
  onClose,
  onSubmit,
  open,
  submitting = false,
  task,
}: CompleteTaskModalProps) {
  if (!open || !task) {
    return null;
  }

  return (
    <CompleteTaskModalForm
      key={task.id}
      onClose={onClose}
      onSubmit={onSubmit}
      submitting={submitting}
      task={task}
    />
  );
}

function CompleteTaskModalForm({
  onClose,
  onSubmit,
  submitting = false,
  task,
}: Omit<CompleteTaskModalProps, "open"> & { task: TaskRecord }) {
  const lead = getLead(task?.leads);
  const [nextDueAt, setNextDueAt] = useState("");
  const [nextStatus, setNextStatus] = useState<LeadStatus | "">(
    (task.cadence?.suggestedLeadStatus as LeadStatus) ||
      (TASK_OUTCOMES[0].suggestedStatus as LeadStatus) ||
      (lead?.status as LeadStatus) ||
      "",
  );
  const [nextTaskType, setNextTaskType] = useState<TaskType>("follow_up");
  const [nextTitle, setNextTitle] = useState("");
  const [note, setNote] = useState("");
  const [outcome, setOutcome] = useState<TaskOutcome>("call_success");
  const suggestedMessage = task.cadence?.suggestedMessage?.trim();
  const suggestedNote = task.cadence?.suggestedNote?.trim();

  function handleOutcomeChange(value: TaskOutcome) {
    setOutcome(value);

    const outcomeOption = TASK_OUTCOMES.find((item) => item.value === value);

    if (outcomeOption?.suggestedStatus) {
      setNextStatus(outcomeOption.suggestedStatus as LeadStatus);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit(task, {
      createNextTask: nextDueAt
        ? {
            dueAt: nextDueAt,
            taskType: nextTaskType,
            title: nextTitle.trim() || undefined,
          }
        : undefined,
      nextStatus: nextStatus || undefined,
      note: note.trim() || undefined,
      outcome,
    });
  }

  async function copySuggestion(value: string) {
    await navigator.clipboard?.writeText(value).catch(() => undefined);
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end bg-ink/40 px-3 pb-3 pt-10 sm:items-center sm:justify-center sm:p-6">
      <form
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-ink">Lưu kết quả follow-up</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {lead ? `Lead: ${lead.name}` : task.title}
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
            Kết quả
            <select
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              onChange={(event) => handleOutcomeChange(event.target.value as TaskOutcome)}
              value={outcome}
            >
              {TASK_OUTCOMES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-bold text-ink">
            Cập nhật trạng thái lead
            <select
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              onChange={(event) => setNextStatus(event.target.value as LeadStatus | "")}
              value={nextStatus}
            >
              <option value="">Giữ nguyên</option>
              {LEAD_STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {task.cadence && (suggestedMessage || suggestedNote) ? (
          <div className="mt-4 rounded-lg border border-ocean/20 bg-ocean/5 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold text-ocean">
                  {task.cadence.templateName} · Bước {task.cadence.stepOrder}/
                  {task.cadence.totalSteps || "?"}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Nội dung gợi ý cho lần chăm sóc này.
                </p>
              </div>
              {suggestedMessage ? (
                <button
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-ocean/20 bg-white px-3 py-2 text-sm font-bold text-ocean hover:border-ocean"
                  onClick={() => copySuggestion(suggestedMessage)}
                  type="button"
                >
                  <Clipboard aria-hidden="true" className="h-4 w-4" />
                  Copy
                </button>
              ) : null}
            </div>
            {suggestedMessage ? (
              <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm leading-7 text-ink">
                {suggestedMessage}
              </p>
            ) : null}
            {suggestedNote ? (
              <div className="mt-3 flex flex-col gap-2 rounded-lg bg-white px-3 py-2 text-sm leading-7 text-slate-600">
                <p>{suggestedNote}</p>
                <button
                  className="self-start text-sm font-bold text-ocean hover:text-ink"
                  onClick={() => setNote(suggestedNote)}
                  type="button"
                >
                  Dùng làm ghi chú
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        <label className="mt-4 block text-sm font-bold text-ink">
          Ghi chú sau khi liên hệ
          <textarea
            className="mt-2 min-h-32 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-base leading-7 text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
            maxLength={5000}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Đã gọi, khách hẹn nhận báo giá..."
            value={note}
          />
        </label>

        <div className="mt-5 rounded-lg bg-cloud p-4">
          <p className="text-sm font-bold text-ink">Tạo follow-up tiếp theo?</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Không tạo thêm", value: "none" },
              { label: "Hẹn ngày mai", value: "tomorrow" },
              { label: "Sau 3 ngày", value: "three_days" },
              { label: "Tuần sau", value: "week" },
            ].map((item) => (
              <button
                className={[
                  "min-h-10 rounded-lg border px-3 py-2 text-sm font-bold",
                  (item.value === "none" && !nextDueAt) ||
                  (item.value !== "none" && nextDueAt === quickDate(item.value as "tomorrow" | "three_days" | "week"))
                    ? "border-ocean bg-white text-ocean"
                    : "border-slate-200 bg-white text-slate-600",
                ].join(" ")}
                key={item.value}
                onClick={() =>
                  setNextDueAt(
                    quickDate(item.value as "none" | "tomorrow" | "three_days" | "week"),
                  )
                }
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>

          {nextDueAt ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold text-ink">
                Ngày giờ kế tiếp
                <input
                  className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
                  onChange={(event) => setNextDueAt(event.target.value)}
                  type="datetime-local"
                  value={nextDueAt}
                />
              </label>
              <label className="text-sm font-bold text-ink">
                Loại việc kế tiếp
                <select
                  className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
                  onChange={(event) => setNextTaskType(event.target.value as TaskType)}
                  value={nextTaskType}
                >
                  {TASK_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-bold text-ink sm:col-span-2">
                Tiêu đề kế tiếp
                <input
                  className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
                  maxLength={120}
                  onChange={(event) => setNextTitle(event.target.value)}
                  placeholder="Follow-up sau báo giá"
                  value={nextTitle}
                />
              </label>
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink hover:border-ocean"
            onClick={onClose}
            type="button"
          >
            Đóng
          </button>
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink hover:bg-[#5de0b3] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={submitting}
            type="submit"
          >
            <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
            {submitting ? "Đang lưu..." : "Lưu kết quả"}
          </button>
        </div>
      </form>
    </div>
  );
}
