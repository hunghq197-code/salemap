"use client";

import { Filter, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import {
  TASK_PRIORITY,
  TASK_STATUS,
  TASK_TYPES,
  type TaskTab,
} from "@/lib/constants/tasks";

export type TaskFilterValues = {
  priority: string;
  status: string;
  taskType: string;
};

type TaskFilterBarProps = {
  activeTab: TaskTab;
  values: TaskFilterValues;
};

const inputClass =
  "mt-2 min-h-12 w-full rounded-control border border-border-soft bg-surface px-3 py-2 text-base text-text-primary outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15";

function activeCount(values: TaskFilterValues) {
  return [values.priority, values.status, values.taskType].filter(Boolean).length;
}

function FilterFields({ values }: { values: TaskFilterValues }) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <label className="text-sm font-bold text-text-primary">
        Loại việc
        <select className={inputClass} defaultValue={values.taskType} name="taskType">
          <option value="">Tất cả</option>
          {TASK_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-bold text-text-primary">
        Ưu tiên
        <select className={inputClass} defaultValue={values.priority} name="priority">
          <option value="">Tất cả</option>
          {TASK_PRIORITY.map((priority) => (
            <option key={priority.value} value={priority.value}>
              {priority.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-bold text-text-primary">
        Trạng thái
        <select className={inputClass} defaultValue={values.status} name="status">
          <option value="">Theo tab hiện tại</option>
          {TASK_STATUS.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function getClearHref(activeTab: TaskTab) {
  return `/app/tasks?tab=${activeTab}`;
}

export function TaskFilterBar({ activeTab, values }: TaskFilterBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const count = activeCount(values);

  return (
    <section className="mt-4">
      <div className="rounded-card border border-border-soft bg-surface p-4 shadow-card lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-text-primary">Bộ lọc task</p>
            <p className="mt-1 text-sm text-text-secondary">
              {count > 0 ? `${count} bộ lọc đang áp dụng` : "Đang dùng bộ lọc mặc định"}
            </p>
          </div>
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-4 py-2 text-sm font-bold text-text-primary shadow-sm"
            onClick={() => setMobileOpen(true)}
            type="button"
          >
            <SlidersHorizontal aria-hidden="true" className="h-5 w-5" />
            Lọc
          </button>
        </div>
      </div>

      <form
        className="hidden rounded-card border border-border-soft bg-surface p-4 shadow-card lg:block"
        method="get"
      >
        <input name="tab" type="hidden" value={activeTab} />
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <FilterFields values={values} />
          <div className="flex gap-2">
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-primary px-4 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-primary-hover"
              type="submit"
            >
              <Filter aria-hidden="true" className="h-4 w-4" />
              Lọc
            </button>
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-4 py-3 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
              href={getClearHref(activeTab)}
            >
              <X aria-hidden="true" className="h-4 w-4" />
              Xóa
            </Link>
          </div>
        </div>
      </form>

      <BottomSheet
        description="Bộ lọc giữ nguyên tab hiện tại và được gửi lên server."
        onOpenChange={setMobileOpen}
        open={mobileOpen}
        title="Lọc việc cần làm"
      >
        <form method="get">
          <input name="tab" type="hidden" value={activeTab} />
          <FilterFields values={values} />
          <div className="sticky bottom-0 -mx-4 mt-5 flex gap-2 border-t border-border-soft bg-surface px-4 pb-1 pt-3">
            <Link
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-control border border-border-soft bg-surface px-4 py-3 text-sm font-bold text-text-primary"
              href={getClearHref(activeTab)}
              onClick={() => setMobileOpen(false)}
            >
              Xóa lọc
            </Link>
            <button
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-control bg-primary px-4 py-3 text-sm font-bold text-white shadow-soft"
              type="submit"
            >
              <Filter aria-hidden="true" className="h-4 w-4" />
              Áp dụng
            </button>
          </div>
        </form>
      </BottomSheet>
    </section>
  );
}
