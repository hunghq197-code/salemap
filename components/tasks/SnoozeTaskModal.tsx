"use client";

import { RotateCcw, X } from "lucide-react";
import { FormEvent, useState } from "react";
import type { TaskRecord } from "@/lib/data/tasks";

export type SnoozeTaskPayload = {
  newDueAt: string;
  reason?: string;
};

type SnoozeTaskModalProps = {
  onClose: () => void;
  onSubmit: (task: TaskRecord, payload: SnoozeTaskPayload) => Promise<void>;
  open: boolean;
  submitting?: boolean;
  task?: TaskRecord | null;
};

function toLocalInputValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function quickDate(kind: "afternoon" | "tomorrow" | "three_days" | "week") {
  const date = new Date();

  if (kind === "afternoon") {
    date.setHours(15, 0, 0, 0);

    if (date.getTime() < Date.now()) {
      date.setDate(date.getDate() + 1);
      date.setHours(9, 0, 0, 0);
    }
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

export function SnoozeTaskModal({
  onClose,
  onSubmit,
  open,
  submitting = false,
  task,
}: SnoozeTaskModalProps) {
  if (!open || !task) {
    return null;
  }

  return (
    <SnoozeTaskModalForm
      key={task.id}
      onClose={onClose}
      onSubmit={onSubmit}
      submitting={submitting}
      task={task}
    />
  );
}

function SnoozeTaskModalForm({
  onClose,
  onSubmit,
  submitting = false,
  task,
}: Omit<SnoozeTaskModalProps, "open"> & { task: TaskRecord }) {
  const [newDueAt, setNewDueAt] = useState(quickDate("tomorrow"));
  const [reason, setReason] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit(task, {
      newDueAt,
      reason: reason.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end bg-ink/40 px-3 pb-3 pt-10 sm:items-center sm:justify-center sm:p-6">
      <form
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-xl"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-ink">Dời lịch</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{task.title}</p>
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

        <label className="mt-5 block text-sm font-bold text-ink">
          Dời đến ngày/giờ
          <input
            className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
            onChange={(event) => setNewDueAt(event.target.value)}
            required
            type="datetime-local"
            value={newDueAt}
          />
        </label>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Chiều nay", value: "afternoon" },
            { label: "Ngày mai", value: "tomorrow" },
            { label: "Sau 3 ngày", value: "three_days" },
            { label: "Tuần sau", value: "week" },
          ].map((item) => (
            <button
              className="min-h-10 rounded-lg border border-slate-200 bg-cloud px-3 py-2 text-sm font-bold text-slate-700 hover:border-ocean hover:bg-white"
              key={item.value}
              onClick={() =>
                setNewDueAt(
                  quickDate(
                    item.value as "afternoon" | "tomorrow" | "three_days" | "week",
                  ),
                )
              }
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-sm font-bold text-ink">
          Lý do
          <textarea
            className="mt-2 min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-base leading-7 text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Khách bận, gọi lại sau..."
            value={reason}
          />
        </label>

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
            <RotateCcw aria-hidden="true" className="h-5 w-5" />
            {submitting ? "Đang dời..." : "Dời lịch"}
          </button>
        </div>
      </form>
    </div>
  );
}
