"use client";

import { CalendarClock } from "lucide-react";
import { useLocalFormDraft } from "@/components/pwa/useLocalFormDraft";
import type { LeadRecord } from "@/lib/data/leads";

type FollowUpFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  defaultRemindAt: string;
  lead: LeadRecord;
  toastCode?: string;
};

export function FollowUpForm({
  action,
  defaultRemindAt,
  lead,
  toastCode,
}: FollowUpFormProps) {
  const {
    clearDraft,
    draftSavedLabel,
    formRef,
    handleChange,
    handleSubmit,
    hasDraft,
    offlineBlocked,
  } = useLocalFormDraft({
    clearOnToastCodes: ["reminder_created"],
    draftKey: `salemap:follow-up-draft:${lead.id}`,
    formName: "lead_follow_up",
    offlineActionType: "create_reminder",
    toastCode,
  });

  return (
    <form
      action={action}
      className="mt-4 space-y-3"
      onChange={handleChange}
      onInput={handleChange}
      onSubmit={handleSubmit}
      ref={formRef}
    >
      <input name="leadId" type="hidden" value={lead.id} />

      {offlineBlocked ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
          Bạn đang offline. Bản nháp follow-up đã được giữ trên máy này; khi có mạng hãy bấm Tạo follow-up lại.
        </div>
      ) : hasDraft ? (
        <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-cloud px-4 py-3 text-sm font-semibold leading-6 text-slate-600">
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

      <label className="block text-sm font-bold text-ink">
        Tiêu đề
        <input
          className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
          defaultValue={`Follow-up ${lead.name}`}
          enterKeyHint="next"
          minLength={2}
          name="title"
          required
        />
      </label>
      <label className="block text-sm font-bold text-ink">
        Ngày giờ nhắc
        <input
          className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
          defaultValue={defaultRemindAt}
          name="remindAt"
          required
          type="datetime-local"
        />
      </label>
      <label className="block text-sm font-bold text-ink">
        Mô tả
        <textarea
          className="mt-2 min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-base leading-7 text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
          enterKeyHint="done"
          maxLength={500}
          name="description"
          placeholder="Nội dung cần nhắc"
        />
      </label>
      <button
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft hover:bg-[#5de0b3]"
        type="submit"
      >
        <CalendarClock aria-hidden="true" className="h-5 w-5" />
        Tạo follow-up
      </button>
    </form>
  );
}
