"use client";

import {
  CheckCircle2,
  ListChecks,
  PauseCircle,
  PlayCircle,
  Plus,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApplyCadenceModal } from "@/components/cadences/ApplyCadenceModal";
import {
  getCadenceStatusLabel,
  getCadenceTaskTypeLabel,
} from "@/lib/constants/cadences";
import type { LeadRecord } from "@/lib/data/leads";
import type { TaskLeadSummary } from "@/lib/data/tasks";
import type { LeadCadence } from "@/lib/types/cadences";

type LeadCadencePanelProps = {
  activeCadence?: LeadCadence | null;
  lead: LeadRecord;
};

type ApiResponse<T> = {
  data?: T;
  error?: string;
  success?: boolean;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as ApiResponse<T>;

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error || "Không thể cập nhật quy trình.");
  }

  return payload.data;
}

function toLeadOption(lead: LeadRecord): TaskLeadSummary {
  return {
    category: lead.category,
    google_maps_url: lead.google_maps_url,
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    source: lead.source,
    status: lead.status,
  };
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Chưa có";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function LeadCadencePanel({
  activeCadence,
  lead,
}: LeadCadencePanelProps) {
  const router = useRouter();
  const [applyOpen, setApplyOpen] = useState(false);
  const [error, setError] = useState("");
  const [submittingAction, setSubmittingAction] = useState("");
  const progress =
    activeCadence && activeCadence.totalSteps > 0
      ? Math.round((activeCadence.completedSteps / activeCadence.totalSteps) * 100)
      : 0;

  async function mutate(action: "pause" | "resume" | "cancel" | "complete") {
    if (!activeCadence) {
      return;
    }

    if (
      action === "cancel" &&
      !window.confirm("Hủy quy trình này và các việc chưa làm?")
    ) {
      return;
    }

    setSubmittingAction(action);
    setError("");

    try {
      await parseResponse<LeadCadence>(
        await fetch(`/api/lead-cadences/${activeCadence.id}/${action}`, {
          body: JSON.stringify({ cancelPendingTasks: true }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }),
      );
      router.refresh();
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Không thể cập nhật quy trình.",
      );
    } finally {
      setSubmittingAction("");
    }
  }

  return (
    <section
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      id="lead-cadence"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            Quy trình chăm sóc
          </p>
          <h2 className="mt-2 text-xl font-bold text-ink">
            {activeCadence?.template?.name || "Chưa áp dụng quy trình"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Tạo sẵn các việc cần làm theo từng ngày để không bỏ quên lead.
          </p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-mint px-4 py-2 text-sm font-bold text-ink hover:bg-[#5de0b3]"
          onClick={() => setApplyOpen(true)}
          type="button"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Áp dụng
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-700">
          {error}
        </div>
      ) : null}

      {activeCadence ? (
        <div className="mt-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-cloud px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Trạng thái
              </p>
              <p className="mt-2 text-base font-bold text-ink">
                {getCadenceStatusLabel(activeCadence.status)}
              </p>
            </div>
            <div className="rounded-lg bg-cloud px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Tiến độ
              </p>
              <p className="mt-2 text-base font-bold text-ink">
                {activeCadence.completedSteps}/{activeCadence.totalSteps} bước
              </p>
            </div>
            <div className="rounded-lg bg-cloud px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Bắt đầu
              </p>
              <p className="mt-2 text-base font-bold text-ink">
                {formatDate(activeCadence.startedAt)}
              </p>
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-mint"
              style={{ width: `${progress}%` }}
            />
          </div>

          {activeCadence.steps?.length ? (
            <div className="mt-5 space-y-2">
              {activeCadence.steps.map((step) => (
                <div
                  className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3"
                  key={`${step.id}-${step.reminderId || ""}`}
                >
                  <span
                    className={[
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                      step.reminderStatus === "completed" || step.reminderStatus === "done"
                        ? "bg-mint text-ink"
                        : "bg-cloud text-ocean",
                    ].join(" ")}
                  >
                    {step.reminderStatus === "completed" || step.reminderStatus === "done" ? (
                      <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                    ) : (
                      step.stepOrder
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ink">{step.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Ngày +{step.dayOffset} · {getCadenceTaskTypeLabel(step.taskType)}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    {step.reminderStatus || "pending"}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {activeCadence.status === "paused" ? (
              <button
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink hover:border-ocean"
                disabled={submittingAction === "resume"}
                onClick={() => mutate("resume")}
                type="button"
              >
                <PlayCircle aria-hidden="true" className="h-4 w-4" />
                Chạy tiếp
              </button>
            ) : (
              <button
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink hover:border-ocean"
                disabled={submittingAction === "pause"}
                onClick={() => mutate("pause")}
                type="button"
              >
                <PauseCircle aria-hidden="true" className="h-4 w-4" />
                Tạm dừng
              </button>
            )}
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink hover:border-ocean"
              disabled={submittingAction === "complete"}
              onClick={() => mutate("complete")}
              type="button"
            >
              <ListChecks aria-hidden="true" className="h-4 w-4" />
              Hoàn thành
            </button>
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100"
              disabled={submittingAction === "cancel"}
              onClick={() => mutate("cancel")}
              type="button"
            >
              <XCircle aria-hidden="true" className="h-4 w-4" />
              Hủy
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-cloud/70 p-5">
          <p className="text-base leading-7 text-slate-600">
            Lead này chưa có quy trình. Bạn có thể áp dụng template như “Chăm sóc
            lead mới” để SaleMap tạo sẵn các việc follow-up.
          </p>
        </div>
      )}

      <ApplyCadenceModal
        defaultLeadId={lead.id}
        leadOptions={[toLeadOption(lead)]}
        onApplied={() => router.refresh()}
        onClose={() => setApplyOpen(false)}
        open={applyOpen}
        source="lead_detail"
      />
    </section>
  );
}
