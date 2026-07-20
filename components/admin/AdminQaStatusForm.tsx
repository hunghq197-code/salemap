"use client";

import { trackQaChecklistUpdated } from "@/lib/analytics/client";

const QA_STATUS_OPTIONS = ["pending", "passed", "failed", "needs_review"] as const;

type QaStatus = (typeof QA_STATUS_OPTIONS)[number];

type AdminQaStatusFormProps = {
  action: (formData: FormData) => void;
  checklistKey: string;
  currentStatus: QaStatus;
};

const statusLabels: Record<QaStatus, string> = {
  failed: "Failed",
  needs_review: "Needs review",
  passed: "Passed",
  pending: "Pending",
};

export function AdminQaStatusForm({
  action,
  checklistKey,
  currentStatus,
}: AdminQaStatusFormProps) {
  function handleSubmit(formData: FormData) {
    trackQaChecklistUpdated({
      checklistKey,
      status: String(formData.get("status") || currentStatus),
    });
    action(formData);
  }

  return (
    <form action={handleSubmit} className="flex flex-wrap gap-2">
      {QA_STATUS_OPTIONS.map((status) => (
        <button
          className={[
            "inline-flex min-h-9 items-center rounded-lg border px-3 py-2 text-xs font-bold transition",
            status === currentStatus
              ? "border-ocean bg-ocean text-white"
              : "border-slate-200 bg-white text-ink hover:border-ocean",
          ].join(" ")}
          key={status}
          name="status"
          type="submit"
          value={status}
        >
          {statusLabels[status]}
        </button>
      ))}
    </form>
  );
}
