"use client";

import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { LEAD_PRIORITY_OPTIONS } from "@/lib/constants/lead-priority";
import { LEAD_STATUS_OPTIONS } from "@/lib/constants/lead-status";

export type LeadFilterValues = {
  category: string;
  createdFrom: string;
  createdTo: string;
  dataView: string;
  followUp: string;
  hasEmail: string;
  hasPhone: string;
  noFollowUp: string;
  priority: string;
  q: string;
  sort: string;
  source: string;
  staleDays: string;
  status: string;
  tagId: string;
};

type LeadFilterBarProps = {
  activeFilterCount: number;
  filterSummary: string[];
  tags: Array<{ id: string; name: string }>;
  values: LeadFilterValues;
};

const inputClass =
  "mt-2 min-h-12 w-full rounded-control border border-border-soft bg-surface px-3 py-2 text-base text-text-primary outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15";

const checkboxClass =
  "flex min-h-12 items-center gap-3 rounded-control border border-border-soft bg-surface px-3 py-2 text-sm font-bold text-text-primary";

function checked(value: string) {
  return value === "1" || value === "true";
}

function PreserveFilters({
  exclude,
  values,
}: {
  exclude?: string[];
  values: LeadFilterValues;
}) {
  const excluded = new Set([...(exclude ?? []), "page"]);

  return (
    <>
      {Object.entries(values).map(([key, value]) => {
        if (!value || excluded.has(key)) return null;
        return <input key={key} name={key} type="hidden" value={value} />;
      })}
    </>
  );
}

function AdvancedFields({
  includeFollowUp = true,
  tags,
  values,
}: Pick<LeadFilterBarProps, "tags" | "values"> & { includeFollowUp?: boolean }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <label className="text-sm font-bold text-text-primary">
        Ưu tiên
        <select className={inputClass} defaultValue={values.priority} name="priority">
          <option value="">Tất cả</option>
          {LEAD_PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-bold text-text-primary">
        Nguồn lead
        <select className={inputClass} defaultValue={values.source} name="source">
          <option value="">Tất cả</option>
          <option value="manual">Thủ công</option>
          <option value="import_csv">Import CSV</option>
          <option value="import_excel">Import Excel</option>
          <option value="map_near_me">Bản đồ gần tôi</option>
          <option value="map_area">Bản đồ khu vực</option>
          <option value="route_search">Tuyến đường</option>
        </select>
      </label>
      <label className="text-sm font-bold text-text-primary">
        Ngành/loại khách
        <input
          className={inputClass}
          defaultValue={values.category}
          name="category"
          placeholder="Nhà thuốc, spa..."
        />
      </label>
      {includeFollowUp ? (
        <label className="text-sm font-bold text-text-primary">
          Follow-up
          <select className={inputClass} defaultValue={values.followUp} name="followUp">
            <option value="">Tất cả</option>
            <option value="today">Hôm nay</option>
            <option value="overdue">Quá hạn</option>
            <option value="today_or_overdue">Hôm nay hoặc quá hạn</option>
            <option value="this_week">Tuần này</option>
            <option value="future">Tương lai</option>
          </select>
        </label>
      ) : null}
      <label className="text-sm font-bold text-text-primary">
        Tag
        <select className={inputClass} defaultValue={values.tagId} name="tagId">
          <option value="">Tất cả</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-bold text-text-primary">
        Từ ngày tạo
        <input
          className={inputClass}
          defaultValue={values.createdFrom}
          name="createdFrom"
          type="date"
        />
      </label>
      <label className="text-sm font-bold text-text-primary">
        Đến ngày tạo
        <input
          className={inputClass}
          defaultValue={values.createdTo}
          name="createdTo"
          type="date"
        />
      </label>
      <label className="text-sm font-bold text-text-primary">
        Lâu chưa chăm sóc
        <input
          className={inputClass}
          defaultValue={values.staleDays}
          min={1}
          name="staleDays"
          placeholder="14"
          type="number"
        />
      </label>
      <div className="grid gap-2 md:col-span-2 xl:col-span-4 xl:grid-cols-4">
        <label className={checkboxClass}>
          <input
            className="h-5 w-5 accent-primary"
            defaultChecked={checked(values.hasPhone)}
            name="hasPhone"
            type="checkbox"
            value="1"
          />
          Có số điện thoại
        </label>
        <label className={checkboxClass}>
          <input
            className="h-5 w-5 accent-primary"
            defaultChecked={checked(values.hasEmail)}
            name="hasEmail"
            type="checkbox"
            value="1"
          />
          Có email
        </label>
        <label className={checkboxClass}>
          <input
            className="h-5 w-5 accent-primary"
            defaultChecked={checked(values.noFollowUp)}
            name="noFollowUp"
            type="checkbox"
            value="1"
          />
          Chưa có lịch hẹn
        </label>
        <label className="text-sm font-bold text-text-primary">
          Dữ liệu
          <select className={inputClass} defaultValue={values.dataView} name="dataView">
            <option value="active">Đang hoạt động</option>
            <option value="archived">Đã lưu trữ</option>
            <option value="deleted">Đã xóa mềm</option>
          </select>
        </label>
      </div>
    </div>
  );
}

export function LeadFilterBar({
  activeFilterCount,
  filterSummary,
  tags,
  values,
}: LeadFilterBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <section className="mt-6">
      <form
        className="rounded-card border border-border-soft bg-surface p-4 shadow-card lg:hidden"
        method="get"
      >
        <PreserveFilters exclude={["q"]} values={values} />
        <div className="flex gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Tìm kiếm lead</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
            />
            <input
              className="min-h-12 w-full rounded-control border border-border-soft bg-surface-muted py-2 pl-10 pr-3 text-base text-text-primary outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
              defaultValue={values.q}
              name="q"
              placeholder="Tìm lead, khu vực..."
            />
          </label>
          <button
            aria-label="Mở bộ lọc"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-4 py-2 text-sm font-bold text-text-primary shadow-sm"
            onClick={() => setMobileOpen(true)}
            type="button"
          >
            <SlidersHorizontal aria-hidden="true" className="h-5 w-5" />
            Lọc
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </div>
      </form>

      <form
        className="hidden rounded-card border border-border-soft bg-surface p-4 shadow-card lg:block"
        method="get"
      >
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(160px,0.8fr)_minmax(160px,0.8fr)_minmax(150px,0.7fr)_auto]">
          <label className="text-sm font-bold text-text-primary">
            Tìm kiếm
            <div className="relative mt-2">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
              />
              <input
                className="min-h-12 w-full rounded-control border border-border-soft bg-surface-muted py-2 pl-10 pr-3 text-base text-text-primary outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                defaultValue={values.q}
                name="q"
                placeholder="Tên, số điện thoại, email, địa chỉ..."
              />
            </div>
          </label>
          <label className="text-sm font-bold text-text-primary">
            Trạng thái
            <select className={inputClass} defaultValue={values.status} name="status">
              <option value="">Tất cả</option>
              {LEAD_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold text-text-primary">
            Follow-up
            <select className={inputClass} defaultValue={values.followUp} name="followUp">
              <option value="">Tất cả</option>
              <option value="today">Hôm nay</option>
              <option value="overdue">Quá hạn</option>
              <option value="today_or_overdue">Hôm nay hoặc quá hạn</option>
              <option value="this_week">Tuần này</option>
              <option value="future">Tương lai</option>
            </select>
          </label>
          <label className="text-sm font-bold text-text-primary">
            Sắp xếp
            <select className={inputClass} defaultValue={values.sort} name="sort">
              <option value="newest">Mới cập nhật</option>
              <option value="oldest">Cũ nhất</option>
              <option value="next_follow_up">Follow-up gần nhất</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-primary px-4 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-primary-hover"
              type="submit"
            >
              <Filter aria-hidden="true" className="h-4 w-4" />
              Lọc
            </button>
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-4 py-3 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
              href="/app/leads"
            >
              <X aria-hidden="true" className="h-4 w-4" />
              Xóa
            </Link>
          </div>
        </div>
        <details className="mt-4 rounded-card border border-border-soft bg-surface-muted p-4">
          <summary className="cursor-pointer text-sm font-bold text-text-primary">
            Bộ lọc nâng cao
          </summary>
          <div className="mt-4">
            <AdvancedFields includeFollowUp={false} tags={tags} values={values} />
          </div>
        </details>
      </form>

      {filterSummary.length > 0 ? (
        <div className="mt-4 rounded-card border border-border-soft bg-surface p-4 shadow-sm">
          <p className="text-sm font-bold text-text-muted">Tóm tắt bộ lọc</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {filterSummary.map((item) => (
              <span
                className="inline-flex min-h-8 items-center rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary"
                key={item}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <BottomSheet
        description="Bộ lọc được gửi lên server và giữ nguyên trên URL."
        onOpenChange={setMobileOpen}
        open={mobileOpen}
        title="Lọc lead"
      >
        <form className="pb-2" method="get">
          <div className="grid gap-3">
            <label className="text-sm font-bold text-text-primary">
              Tìm kiếm
              <input
                className={inputClass}
                defaultValue={values.q}
                name="q"
                placeholder="Tên, số điện thoại, email, địa chỉ..."
              />
            </label>
            <label className="text-sm font-bold text-text-primary">
              Trạng thái
              <select className={inputClass} defaultValue={values.status} name="status">
                <option value="">Tất cả</option>
                {LEAD_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-bold text-text-primary">
              Sắp xếp
              <select className={inputClass} defaultValue={values.sort} name="sort">
                <option value="newest">Mới cập nhật</option>
                <option value="oldest">Cũ nhất</option>
                <option value="next_follow_up">Follow-up gần nhất</option>
              </select>
            </label>
            <AdvancedFields tags={tags} values={values} />
          </div>
          <div className="sticky bottom-0 -mx-4 mt-5 flex gap-2 border-t border-border-soft bg-surface px-4 pb-1 pt-3">
            <Link
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-control border border-border-soft bg-surface px-4 py-3 text-sm font-bold text-text-primary"
              href="/app/leads"
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
