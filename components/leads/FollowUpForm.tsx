"use client";

import { CalendarClock } from "lucide-react";
import { useFormStatus } from "react-dom";
import { useLocalFormDraft } from "@/components/pwa/useLocalFormDraft";
import type { LeadRecord } from "@/lib/data/leads";

type FollowUpFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  defaultRemindAt: string;
  lead: LeadRecord;
  toastCode?: string;
};

const inputClass =
  "mt-2 min-h-12 w-full rounded-control border border-border-soft bg-surface px-3 py-2 text-base text-text-primary outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15";

function FollowUpSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-primary px-5 py-3 text-base font-bold text-white shadow-soft transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      <CalendarClock aria-hidden="true" className="h-5 w-5" />
      {pending ? "Đang tạo..." : "Tạo follow-up"}
    </button>
  );
}

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
        <div className="rounded-control border border-warning/25 bg-warning-soft px-4 py-3 text-sm font-semibold leading-6 text-amber-900">
          Bạn đang offline. Bản nháp follow-up đã được giữ trên máy này; khi có mạng hãy bấm Tạo follow-up lại.
        </div>
      ) : hasDraft ? (
        <div className="flex flex-col gap-2 rounded-control border border-border-soft bg-surface-muted px-4 py-3 text-sm font-semibold leading-6 text-text-secondary">
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

      <label className="block text-sm font-bold text-text-primary">
        Tiêu đề
        <input
          className={inputClass}
          defaultValue={`Follow-up ${lead.name}`}
          enterKeyHint="next"
          minLength={2}
          name="title"
          required
        />
      </label>
      <label className="block text-sm font-bold text-text-primary">
        Ngày giờ nhắc
        <input
          className={inputClass}
          defaultValue={defaultRemindAt}
          name="remindAt"
          required
          type="datetime-local"
        />
      </label>
      <label className="block text-sm font-bold text-text-primary">
        Mô tả
        <textarea
          className="mt-2 min-h-24 w-full resize-y rounded-control border border-border-soft bg-surface px-3 py-2 text-base leading-7 text-text-primary outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
          enterKeyHint="done"
          maxLength={500}
          name="description"
          placeholder="Nội dung cần nhắc"
        />
      </label>
      <FollowUpSubmitButton />
    </form>
  );
}
