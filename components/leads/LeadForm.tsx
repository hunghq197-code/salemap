"use client";

import { Save } from "lucide-react";
import Link from "next/link";
import { useLocalFormDraft } from "@/components/pwa/useLocalFormDraft";
import { LEAD_PRIORITY_OPTIONS } from "@/lib/constants/lead-priority";
import { LEAD_STATUS_OPTIONS } from "@/lib/constants/lead-status";
import type { LeadRecord } from "@/lib/data/leads";
import type { TagRecord } from "@/lib/data/tags";

type LeadFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref?: string;
  lead?: LeadRecord | null;
  submitLabel: string;
  tags: TagRecord[];
  toastCode?: string;
};

function fieldClass() {
  return "mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/15";
}

function labelClass() {
  return "text-sm font-bold text-ink";
}

export function LeadForm({
  action,
  cancelHref = "/app/leads",
  lead,
  submitLabel,
  tags,
  toastCode,
}: LeadFormProps) {
  const selectedTagIds = new Set(lead?.tags.map((tag) => tag.id) ?? []);
  const {
    clearDraft,
    draftSavedLabel,
    formRef,
    handleChange,
    handleSubmit,
    hasDraft,
    offlineBlocked,
  } = useLocalFormDraft({
    clearOnToastCodes: ["lead_created", "lead_updated"],
    draftKey: `salemap:lead-form-draft:${lead?.id ?? "new"}`,
    formName: lead ? "lead_update" : "lead_create",
    toastCode,
  });

  return (
    <form
      action={action}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      onChange={handleChange}
      onInput={handleChange}
      onSubmit={handleSubmit}
      ref={formRef}
    >
      {offlineBlocked ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
          Bạn đang offline. Bản nháp lead đã được giữ trên máy này; khi có mạng hãy bấm Lưu lead lại.
        </div>
      ) : hasDraft ? (
        <div className="mb-4 flex flex-col gap-2 rounded-lg border border-slate-200 bg-cloud px-4 py-3 text-sm font-semibold leading-6 text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>Bản nháp đã lưu trên máy{draftSavedLabel ? ` lúc ${draftSavedLabel}` : ""}.</span>
          <button
            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-ink"
            onClick={clearDraft}
            type="button"
          >
            Xóa bản nháp
          </button>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass()}>
          Tên khách/đơn vị *
          <input
            autoComplete="organization"
            className={fieldClass()}
            defaultValue={lead?.name ?? ""}
            maxLength={160}
            minLength={2}
            name="name"
            placeholder="VD: Nhà thuốc Minh An"
            required
          />
        </label>
        <label className={labelClass()}>
          Số điện thoại
          <input
            autoComplete="tel"
            className={fieldClass()}
            defaultValue={lead?.phone ?? ""}
            inputMode="tel"
            maxLength={40}
            name="phone"
            placeholder="VD: 090..."
          />
        </label>
        <label className={labelClass()}>
          Email
          <input
            autoComplete="email"
            className={fieldClass()}
            defaultValue={lead?.email ?? ""}
            inputMode="email"
            maxLength={160}
            name="email"
            placeholder="email@congty.com"
            type="email"
          />
        </label>
        <label className={labelClass()}>
          Website
          <input
            autoComplete="url"
            className={fieldClass()}
            defaultValue={lead?.website ?? ""}
            maxLength={200}
            name="website"
            placeholder="congty.vn"
          />
        </label>
        <label className={labelClass()}>
          Ngành/loại khách
          <input
            className={fieldClass()}
            defaultValue={lead?.category ?? ""}
            maxLength={120}
            name="category"
            placeholder="VD: Nhà thuốc, đại lý, công ty xây dựng"
          />
        </label>
        <label className={labelClass()}>
          Nguồn lead
          <input
            className={fieldClass()}
            defaultValue={lead?.source ?? "manual"}
            maxLength={80}
            name="source"
            placeholder="manual, referral, map..."
          />
        </label>
        <label className={labelClass()}>
          Trạng thái
          <select className={fieldClass()} defaultValue={lead?.status ?? "new"} name="status">
            {LEAD_STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass()}>
          Mức ưu tiên
          <select
            className={fieldClass()}
            defaultValue={lead?.priority ?? "medium"}
            name="priority"
          >
            {LEAD_PRIORITY_OPTIONS.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={`${labelClass()} mt-4 block`}>
        Địa chỉ
        <input
          className={fieldClass()}
          defaultValue={lead?.address ?? ""}
          maxLength={300}
          name="address"
          placeholder="Khu vực, quận/huyện hoặc địa chỉ chi tiết"
        />
      </label>

      <label className={`${labelClass()} mt-4 block`}>
        Ghi chú nhanh
        <textarea
          className={`${fieldClass()} min-h-28 resize-y leading-7`}
          defaultValue={lead?.note_summary ?? ""}
          maxLength={500}
          name="noteSummary"
          placeholder="Nhu cầu, vấn đề, lần trao đổi gần nhất..."
        />
      </label>

      {tags.length > 0 ? (
        <fieldset className="mt-4">
          <legend className={labelClass()}>Tags</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <label
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-cloud px-3 py-2 text-sm font-bold text-slate-700"
                key={tag.id}
              >
                <input
                  className="h-4 w-4 accent-ocean"
                  defaultChecked={selectedTagIds.has(tag.id)}
                  name="tagIds"
                  type="checkbox"
                  value={tag.id}
                />
                {tag.name}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <label className={`${labelClass()} mt-4 block`}>
        Tạo tag mới
        <input
          className={fieldClass()}
          maxLength={240}
          name="newTags"
          placeholder="VD: Khách nóng, Quận 1, cần gọi lại"
        />
      </label>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft hover:bg-[#5de0b3]"
          type="submit"
        >
          <Save aria-hidden="true" className="h-5 w-5" />
          {submitLabel}
        </button>
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink hover:border-ocean hover:text-ocean"
          href={cancelHref}
        >
          Hủy
        </Link>
      </div>
    </form>
  );
}
