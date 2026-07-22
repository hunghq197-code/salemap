"use client";

import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  CADENCE_CATEGORY_OPTIONS,
  CADENCE_PRIORITY_OPTIONS,
  CADENCE_TASK_TYPE_OPTIONS,
} from "@/lib/constants/cadences";
import { LEAD_STATUS_OPTIONS } from "@/lib/constants/lead-status";
import type { CadenceTemplate } from "@/lib/types/cadences";

type CadenceTemplateFormProps = {
  initialTemplate?: CadenceTemplate | null;
  mode: "create" | "edit";
};

type FormStep = {
  clientId: string;
  dayOffset: number;
  isRequired: boolean;
  priority: string;
  suggestedLeadStatus: string;
  suggestedMessage: string;
  suggestedNote: string;
  taskType: string;
  title: string;
};

type ApiResponse<T> = {
  data?: T;
  error?: string;
  success?: boolean;
};

function newStep(index: number): FormStep {
  return {
    clientId: crypto.randomUUID(),
    dayOffset: index === 0 ? 0 : index * 3,
    isRequired: true,
    priority: index === 0 ? "high" : "medium",
    suggestedLeadStatus: index === 0 ? "contacted" : "follow_up",
    suggestedMessage: "",
    suggestedNote: "",
    taskType: index === 0 ? "call" : "follow_up",
    title: index === 0 ? "Gọi lần đầu" : `Follow-up lần ${index}`,
  };
}

function toInitialSteps(template?: CadenceTemplate | null): FormStep[] {
  if (!template?.steps?.length) {
    return [newStep(0), newStep(1), newStep(2)];
  }

  return template.steps.map((step) => ({
    clientId: step.id,
    dayOffset: step.dayOffset,
    isRequired: step.isRequired,
    priority: step.priority || "medium",
    suggestedLeadStatus: step.suggestedLeadStatus || "",
    suggestedMessage: step.suggestedMessage || "",
    suggestedNote: step.suggestedNote || "",
    taskType: step.taskType || "follow_up",
    title: step.title,
  }));
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as ApiResponse<T>;

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error || "Không thể lưu quy trình.");
  }

  return payload.data;
}

export function CadenceTemplateForm({
  initialTemplate,
  mode,
}: CadenceTemplateFormProps) {
  const router = useRouter();
  const [category, setCategory] = useState(initialTemplate?.category || "general");
  const [description, setDescription] = useState(initialTemplate?.description || "");
  const [error, setError] = useState("");
  const [isActive, setIsActive] = useState(initialTemplate?.isActive ?? true);
  const [name, setName] = useState(initialTemplate?.name || "");
  const [steps, setSteps] = useState<FormStep[]>(toInitialSteps(initialTemplate));
  const [submitting, setSubmitting] = useState(false);

  function updateStep(clientId: string, patch: Partial<FormStep>) {
    setSteps((current) =>
      current.map((step) => (step.clientId === clientId ? { ...step, ...patch } : step)),
    );
  }

  function addStep() {
    setSteps((current) => [...current, newStep(current.length)]);
  }

  function removeStep(clientId: string) {
    setSteps((current) =>
      current.length > 1 ? current.filter((step) => step.clientId !== clientId) : current,
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = {
        category,
        description: description.trim() || undefined,
        isActive,
        name: name.trim(),
        steps: steps
          .map((step, index) => ({
            dayOffset: Number(step.dayOffset),
            isRequired: step.isRequired,
            priority: step.priority,
            stepOrder: index + 1,
            suggestedLeadStatus: step.suggestedLeadStatus || undefined,
            suggestedMessage: step.suggestedMessage.trim() || undefined,
            suggestedNote: step.suggestedNote.trim() || undefined,
            taskType: step.taskType,
            title: step.title.trim(),
          })),
      };
      const endpoint =
        mode === "edit" && initialTemplate
          ? `/api/cadences/templates/${initialTemplate.id}`
          : "/api/cadences/templates";
      const method = mode === "edit" ? "PUT" : "POST";
      const template = await parseResponse<CadenceTemplate>(
        await fetch(endpoint, {
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
          method,
        }),
      );

      router.push(`/app/cadences/${template.id}`);
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Không thể lưu quy trình.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-ink">
            Tên quy trình
            <input
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              maxLength={80}
              minLength={2}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ví dụ: Chăm sóc lead mới"
              required
              value={name}
            />
          </label>

          <label className="text-sm font-bold text-ink">
            Nhóm
            <select
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              onChange={(event) => setCategory(event.target.value)}
              value={category}
            >
              {CADENCE_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-4 block text-sm font-bold text-ink">
          Mô tả
          <textarea
            className="mt-2 min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-base leading-7 text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
            maxLength={500}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Khi nào nên dùng quy trình này?"
            value={description}
          />
        </label>

        <label className="mt-4 flex items-start gap-3 rounded-lg bg-cloud px-4 py-3 text-sm font-semibold text-slate-700">
          <input
            checked={isActive}
            className="mt-1 h-4 w-4 accent-ocean"
            onChange={(event) => setIsActive(event.target.checked)}
            type="checkbox"
          />
          Cho phép áp dụng quy trình này cho lead.
        </label>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink">Các bước chăm sóc</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Mỗi bước sẽ trở thành một việc cần làm trong Task Center.
            </p>
          </div>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink hover:border-ocean"
            onClick={addStep}
            type="button"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Thêm bước
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {steps.map((step, index) => (
            <article
              className="rounded-lg border border-slate-200 bg-cloud/60 p-4"
              key={step.clientId}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-ocean">Bước {index + 1}</p>
                  <h3 className="mt-1 text-base font-bold text-ink">
                    {step.title || "Chưa đặt tên"}
                  </h3>
                </div>
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={steps.length <= 1}
                  onClick={() => removeStep(step.clientId)}
                  type="button"
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                  <span className="sr-only">Xóa bước</span>
                </button>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-bold text-ink">
                  Tiêu đề việc
                  <input
                    className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
                    maxLength={120}
                    minLength={2}
                    onChange={(event) => updateStep(step.clientId, { title: event.target.value })}
                    required
                    value={step.title}
                  />
                </label>

                <label className="text-sm font-bold text-ink">
                  Sau ngày bắt đầu
                  <input
                    className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
                    min={0}
                    onChange={(event) =>
                      updateStep(step.clientId, { dayOffset: Number(event.target.value) })
                    }
                    type="number"
                    value={step.dayOffset}
                  />
                </label>

                <label className="text-sm font-bold text-ink">
                  Loại việc
                  <select
                    className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
                    onChange={(event) =>
                      updateStep(step.clientId, { taskType: event.target.value })
                    }
                    value={step.taskType}
                  >
                    {CADENCE_TASK_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-bold text-ink">
                  Priority
                  <select
                    className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
                    onChange={(event) =>
                      updateStep(step.clientId, { priority: event.target.value })
                    }
                    value={step.priority}
                  >
                    {CADENCE_PRIORITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-bold text-ink sm:col-span-2">
                  Trạng thái lead gợi ý sau khi hoàn thành
                  <select
                    className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
                    onChange={(event) =>
                      updateStep(step.clientId, {
                        suggestedLeadStatus: event.target.value,
                      })
                    }
                    value={step.suggestedLeadStatus}
                  >
                    <option value="">Không gợi ý</option>
                    {LEAD_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="mt-4 block text-sm font-bold text-ink">
                Tin nhắn gợi ý
                <textarea
                  className="mt-2 min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-base leading-7 text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
                  maxLength={2000}
                  onChange={(event) =>
                    updateStep(step.clientId, { suggestedMessage: event.target.value })
                  }
                  placeholder="Nội dung sale có thể copy để nhắn khách"
                  value={step.suggestedMessage}
                />
              </label>

              <label className="mt-4 block text-sm font-bold text-ink">
                Note nội bộ gợi ý
                <textarea
                  className="mt-2 min-h-20 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-base leading-7 text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
                  maxLength={2000}
                  onChange={(event) =>
                    updateStep(step.clientId, { suggestedNote: event.target.value })
                  }
                  placeholder="Gợi ý cách xử lý hoặc điều cần kiểm tra"
                  value={step.suggestedNote}
                />
              </label>
            </article>
          ))}
        </div>
      </section>

      <div className="sticky bottom-0 z-10 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white/95 py-3 backdrop-blur sm:flex-row sm:justify-between">
        <Link
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink hover:border-ocean"
          href={initialTemplate ? `/app/cadences/${initialTemplate.id}` : "/app/cadences"}
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
          Quay lại
        </Link>
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft hover:bg-[#5de0b3] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={submitting}
          type="submit"
        >
          <Save aria-hidden="true" className="h-5 w-5" />
          {submitting ? "Đang lưu..." : "Lưu quy trình"}
        </button>
      </div>
    </form>
  );
}
