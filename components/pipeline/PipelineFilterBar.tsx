"use client";

import { Filter, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { LEAD_STATUS_OPTIONS } from "@/lib/constants/lead-status";
import type { TagRecord } from "@/lib/data/tags";

export type PipelineFilterValues = {
  cadence: string;
  followUp: string;
  sort: string;
  source: string;
  stage: string;
  tagId: string;
};

type PipelineFilterBarProps = {
  activeFilterCount: number;
  tags: TagRecord[];
  values: PipelineFilterValues;
};

const inputClass =
  "mt-2 min-h-12 w-full rounded-control border border-border-soft bg-surface px-3 py-2 text-base text-text-primary outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15";

const sourceOptions = [
  { label: "Thủ công", value: "manual" },
  { label: "Import CSV", value: "import_csv" },
  { label: "Import Excel", value: "import_excel" },
  { label: "Bản đồ gần tôi", value: "map_near_me" },
  { label: "Bản đồ khu vực", value: "map_area" },
  { label: "Tuyến đường", value: "route_search" },
] as const;

function FilterFields({
  tags,
  values,
}: Pick<PipelineFilterBarProps, "tags" | "values">) {
  return (
    <>
      <label className="text-sm font-bold text-text-primary">
        Stage
        <select className={inputClass} defaultValue={values.stage} name="stage">
          <option value="">Tất cả stage</option>
          {LEAD_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-bold text-text-primary">
        Nguồn
        <select className={inputClass} defaultValue={values.source} name="source">
          <option value="">Tất cả nguồn</option>
          {sourceOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-bold text-text-primary">
        Follow-up
        <select className={inputClass} defaultValue={values.followUp} name="followUp">
          <option value="">Tất cả lịch hẹn</option>
          <option value="today">Hôm nay</option>
          <option value="overdue">Quá hạn</option>
          <option value="today_or_overdue">Hôm nay hoặc quá hạn</option>
          <option value="this_week">Tuần này</option>
          <option value="future">Tương lai</option>
        </select>
      </label>
      <label className="text-sm font-bold text-text-primary">
        Cadence
        <select className={inputClass} defaultValue={values.cadence} name="cadence">
          <option value="">Tất cả</option>
          <option value="active">Đang chạy</option>
          <option value="paused">Tạm dừng</option>
          <option value="none">Chưa có cadence</option>
        </select>
      </label>
      <label className="text-sm font-bold text-text-primary">
        Tag
        <select className={inputClass} defaultValue={values.tagId} name="tagId">
          <option value="">Tất cả tag</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-bold text-text-primary">
        Sắp xếp
        <select className={inputClass} defaultValue={values.sort} name="sort">
          <option value="position">Vị trí trong stage</option>
          <option value="updated">Mới cập nhật</option>
          <option value="follow_up">Follow-up gần nhất</option>
          <option value="name">Tên A-Z</option>
        </select>
      </label>
    </>
  );
}

function FilterActions({ onClear }: { onClear?: () => void }) {
  return (
    <div className="flex w-full items-end gap-2">
      <button
        className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-control bg-primary px-4 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-primary-hover lg:flex-none"
        type="submit"
      >
        <Filter aria-hidden="true" className="h-4 w-4" />
        Áp dụng
      </button>
      <Link
        className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-4 py-3 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary lg:flex-none"
        href="/app/pipeline"
        onClick={onClear}
      >
        <X aria-hidden="true" className="h-4 w-4" />
        Xóa
      </Link>
    </div>
  );
}

export function PipelineFilterBar({
  activeFilterCount,
  tags,
  values,
}: PipelineFilterBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <section className="mt-6" id="pipeline-filters">
      <div className="lg:hidden">
        <button
          aria-expanded={mobileOpen}
          aria-haspopup="dialog"
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-4 py-3 text-sm font-bold text-text-primary shadow-sm"
          onClick={() => setMobileOpen(true)}
          type="button"
        >
          <SlidersHorizontal aria-hidden="true" className="h-5 w-5" />
          Bộ lọc pipeline
          {activeFilterCount > 0 ? (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
      </div>

      <form
        className="hidden rounded-card border border-border-soft bg-surface p-4 shadow-card lg:block"
        method="get"
      >
        <div className="grid gap-3 xl:grid-cols-[repeat(6,minmax(0,1fr))_auto]">
          <FilterFields tags={tags} values={values} />
          <FilterActions />
        </div>
      </form>

      <BottomSheet
        description="Chỉ dùng stage, nguồn, follow-up, cadence, tag và sort trên URL."
        onOpenChange={setMobileOpen}
        open={mobileOpen}
        title="Lọc pipeline"
      >
        <form className="pb-2" method="get">
          <div className="grid gap-3">
            <FilterFields tags={tags} values={values} />
          </div>
          <div className="sticky bottom-0 -mx-4 mt-5 flex gap-2 border-t border-border-soft bg-surface px-4 pb-1 pt-3">
            <FilterActions onClear={() => setMobileOpen(false)} />
          </div>
        </form>
      </BottomSheet>
    </section>
  );
}
