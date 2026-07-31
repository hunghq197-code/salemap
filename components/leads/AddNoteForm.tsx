"use client";

import { PlusCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { useLocalFormDraft } from "@/components/pwa/useLocalFormDraft";
import { INTERACTION_TYPE_OPTIONS } from "@/lib/constants/interaction-types";
import { LEAD_STATUS_OPTIONS } from "@/lib/constants/lead-status";
import type { LeadRecord } from "@/lib/data/leads";

type AddNoteFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  lead: LeadRecord;
  toastCode?: string;
};

const inputClass =
  "mt-2 min-h-12 w-full rounded-control border border-border-soft bg-surface px-3 py-2 text-base text-text-primary outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15";

function tomorrowMorningLocal() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function AddNoteSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-primary px-5 py-3 text-base font-bold text-white shadow-soft transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      disabled={pending}
      type="submit"
    >
      <PlusCircle aria-hidden="true" className="h-5 w-5" />
      {pending ? "Đang lưu..." : "Lưu ghi chú"}
    </button>
  );
}

export function AddNoteForm({ action, lead, toastCode }: AddNoteFormProps) {
  const {
    clearDraft,
    draftSavedLabel,
    formRef,
    handleChange,
    handleSubmit,
    hasDraft,
    offlineBlocked,
  } = useLocalFormDraft({
    clearOnToastCodes: ["lead_note_created", "lead_note_with_reminder_created"],
    draftKey: `salemap:lead-note-draft:${lead.id}`,
    formName: "lead_note",
    offlineActionType: "create_lead_note",
    toastCode,
  });

  return (
    <form
      action={action}
      className="rounded-card border border-border-soft bg-surface p-4 shadow-sm sm:p-5"
      onChange={handleChange}
      onInput={handleChange}
      onSubmit={handleSubmit}
      ref={formRef}
    >
      <input name="leadId" type="hidden" value={lead.id} />
      {offlineBlocked ? (
        <div className="mb-4 rounded-control border border-warning/25 bg-warning-soft px-4 py-3 text-sm font-semibold leading-6 text-amber-900">
          Bạn đang offline. Bản nháp ghi chú đã được giữ trên máy này; khi có mạng hãy bấm Lưu ghi chú lại.
        </div>
      ) : hasDraft ? (
        <div className="mb-4 flex flex-col gap-2 rounded-control border border-border-soft bg-surface-muted px-4 py-3 text-sm font-semibold leading-6 text-text-secondary sm:flex-row sm:items-center sm:justify-between">
          <span>
            Bản nháp đã lưu trên máy{draftSavedLabel ? ` lúc ${draftSavedLabel}` : ""}.
          </span>
          <button
            className="inline-flex min-h-9 items-center justify-center rounded-control border border-border-soft bg-surface px-3 py-1.5 text-xs font-bold text-text-primary"
            onClick={clearDraft}
            type="button"
          >
            Xóa bản nháp
          </button>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm font-bold text-text-primary">
          Loại tương tác *
          <select className={inputClass} name="interactionType" required>
            {INTERACTION_TYPE_OPTIONS.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold text-text-primary">
          Kết quả
          <input
            className={inputClass}
            maxLength={120}
            name="outcome"
            placeholder="VD: khách muốn nhận báo giá"
          />
        </label>
        <label className="text-sm font-bold text-text-primary">
          Cập nhật trạng thái
          <select
            className={inputClass}
            defaultValue={lead.status ?? "new"}
            name="statusAfter"
          >
            {LEAD_STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 block text-sm font-bold text-text-primary">
        Nội dung ghi chú *
        <textarea
          className="mt-2 min-h-32 w-full resize-y rounded-control border border-border-soft bg-surface px-3 py-2 text-base leading-7 text-text-primary outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
          enterKeyHint="done"
          maxLength={2000}
          minLength={2}
          name="content"
          placeholder="Đã gọi, khách muốn nhận báo giá..."
          required
        />
      </label>

      <div className="mt-4 rounded-control bg-surface-muted p-4">
        <label className="flex items-start gap-3 text-sm font-bold text-text-primary">
          <input
            className="mt-1 h-4 w-4 accent-primary"
            name="createReminder"
            type="checkbox"
          />
          Có tạo lịch follow-up không?
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold text-text-primary">
            Tiêu đề follow-up
            <input
              className={inputClass}
              defaultValue={`Follow-up ${lead.name}`}
              maxLength={160}
              name="reminderTitle"
              placeholder={`Follow-up ${lead.name}`}
            />
          </label>
          <label className="text-sm font-bold text-text-primary">
            Ngày giờ nhắc
            <input
              className={inputClass}
              defaultValue={tomorrowMorningLocal()}
              name="remindAt"
              type="datetime-local"
            />
          </label>
        </div>
        <label className="mt-3 block text-sm font-bold text-text-primary">
          Mô tả thêm
          <textarea
            className="mt-2 min-h-24 w-full resize-y rounded-control border border-border-soft bg-surface px-3 py-2 text-base leading-7 text-text-primary outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
            enterKeyHint="done"
            maxLength={500}
            name="reminderDescription"
            placeholder="Nội dung cần chuẩn bị cho lần follow-up"
          />
        </label>
      </div>

      <AddNoteSubmitButton />
    </form>
  );
}
