"use client";

import { CalendarPlus, CheckCircle2, ListChecks, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  getCadenceCategoryLabel,
  getCadencePriorityLabel,
  getCadenceTaskTypeLabel,
} from "@/lib/constants/cadences";
import type { TaskLeadSummary } from "@/lib/data/tasks";
import type { CadenceTemplate } from "@/lib/types/cadences";

type ApplyCadenceModalProps = {
  defaultLeadId?: string | null;
  defaultTemplateId?: string | null;
  leadOptions: TaskLeadSummary[];
  onApplied?: (result: ApplyCadenceResult) => void;
  onClose: () => void;
  open: boolean;
  source?: string;
};

type ApplyCadenceResult = {
  createdTasksCount: number;
  leadCadence?: {
    id: string;
  };
};

type ApiResponse<T> = {
  code?: string;
  data?: T;
  error?: string;
  success?: boolean;
};

function todayDateValue() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatPreviewDate(startDate: string, dayOffset: number) {
  const date = new Date(startDate);

  if (Number.isNaN(date.getTime())) {
    return `+${dayOffset} ngày`;
  }

  date.setDate(date.getDate() + dayOffset);

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  return (await response.json().catch(() => ({}))) as ApiResponse<T>;
}

export function ApplyCadenceModal({
  defaultLeadId,
  defaultTemplateId,
  leadOptions,
  onApplied,
  onClose,
  open,
  source = "unknown",
}: ApplyCadenceModalProps) {
  const [error, setError] = useState("");
  const [leadId, setLeadId] = useState(defaultLeadId || "");
  const [replaceExistingActive, setReplaceExistingActive] = useState(false);
  const [startDate, setStartDate] = useState(todayDateValue());
  const [submitting, setSubmitting] = useState(false);
  const [templates, setTemplates] = useState<CadenceTemplate[]>([]);
  const [templateId, setTemplateId] = useState(defaultTemplateId || "");
  const templatesRequestedRef = useRef(false);
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === templateId) ?? null,
    [templateId, templates],
  );
  const templatesLoading = open && templates.length === 0 && !error;

  useEffect(() => {
    if (!open || templatesRequestedRef.current) {
      return;
    }

    templatesRequestedRef.current = true;
    fetch("/api/cadences/templates?limit=50")
      .then(parseResponse<{ items: CadenceTemplate[]; schemaReady: boolean }>)
      .then((payload) => {
        if (!payload.success || !payload.data) {
          throw new Error(payload.error || "Không thể tải quy trình chăm sóc.");
        }

        setTemplates(payload.data.items);
        setTemplateId((current) => {
          if (current) return current;

          const recommended =
            payload.data?.items.find((template) => template.category === "new_lead") ||
            payload.data?.items[0];

          return recommended?.id || "";
        });
      })
      .catch((loadError) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Không thể tải quy trình chăm sóc.",
        );
      });
  }, [open]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/cadences/apply", {
        body: JSON.stringify({
          cadenceTemplateId: templateId,
          leadId,
          replaceExistingActive,
          source,
          startDate,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await parseResponse<ApplyCadenceResult>(response);

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(
          payload.error ||
            "Không thể áp dụng quy trình. Vui lòng kiểm tra lại lead và template.",
        );
      }

      onApplied?.(payload.data);
      onClose();
    } catch (applyError) {
      setError(
        applyError instanceof Error
          ? applyError.message
          : "Không thể áp dụng quy trình.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-end bg-ink/40 px-3 pb-3 pt-10 sm:items-center sm:justify-center sm:p-6">
      <form
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
              Quy trình chăm sóc
            </p>
            <h2 className="mt-2 text-2xl font-bold text-ink">
              Áp dụng quy trình cho lead
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              SaleMap sẽ tạo các việc cần làm theo mốc ngày. Bạn vẫn chủ động gọi,
              nhắn Zalo hoặc ghi chú kết quả.
            </p>
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

        {error ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-ink">
            Lead
            <select
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              disabled={Boolean(defaultLeadId)}
              onChange={(event) => setLeadId(event.target.value)}
              required
              value={leadId}
            >
              <option value="">Chọn lead</option>
              {leadOptions.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-bold text-ink">
            Ngày bắt đầu
            <input
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              onChange={(event) => setStartDate(event.target.value)}
              required
              type="date"
              value={startDate}
            />
          </label>
        </div>

        <label className="mt-4 block text-sm font-bold text-ink">
          Template
          <select
            className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
            disabled={templatesLoading}
            onChange={(event) => setTemplateId(event.target.value)}
            required
            value={templateId}
          >
            <option value="">
              {templatesLoading ? "Đang tải quy trình..." : "Chọn quy trình"}
            </option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} · {getCadenceCategoryLabel(template.category)}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 flex items-start gap-3 rounded-lg border border-slate-200 bg-cloud/70 p-4 text-sm font-semibold leading-6 text-slate-700">
          <input
            checked={replaceExistingActive}
            className="mt-1 h-4 w-4 accent-ocean"
            onChange={(event) => setReplaceExistingActive(event.target.checked)}
            type="checkbox"
          />
          Thay thế quy trình đang chạy của lead này nếu có.
        </label>

        {selectedTemplate ? (
          <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-mint/15 text-ocean">
                <ListChecks aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-ink">
                  {selectedTemplate.name}
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {selectedTemplate.description || "Quy trình chăm sóc lead."}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {(selectedTemplate.steps ?? []).map((step) => (
                <div
                  className="grid gap-2 rounded-lg bg-cloud px-3 py-2 text-sm sm:grid-cols-[80px_1fr]"
                  key={step.id}
                >
                  <p className="font-bold text-ocean">
                    {formatPreviewDate(startDate, step.dayOffset)}
                  </p>
                  <div>
                    <p className="font-bold text-ink">
                      Bước {step.stepOrder}: {step.title}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {getCadenceTaskTypeLabel(step.taskType)} ·{" "}
                      {getCadencePriorityLabel(step.priority)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

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
            disabled={submitting || templatesLoading || !leadId || !templateId}
            type="submit"
          >
            {submitting ? (
              <CalendarPlus aria-hidden="true" className="h-5 w-5" />
            ) : (
              <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
            )}
            {submitting ? "Đang áp dụng..." : "Áp dụng quy trình"}
          </button>
        </div>
      </form>
    </div>
  );
}
