"use client";

import { Copy, Edit3, PlayCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApplyCadenceModal } from "@/components/cadences/ApplyCadenceModal";
import type { TaskLeadSummary } from "@/lib/data/tasks";

type CadenceTemplateActionsProps = {
  leadOptions: TaskLeadSummary[];
  templateId: string;
  templateIsSystem?: boolean;
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

export function CadenceTemplateActions({
  leadOptions,
  templateId,
  templateIsSystem = false,
}: CadenceTemplateActionsProps) {
  const router = useRouter();
  const [applyOpen, setApplyOpen] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState("");

  async function duplicateTemplate() {
    setSubmitting("duplicate");
    setError("");

    try {
      const template = await parseResponse<{ id: string }>(
        await fetch(`/api/cadences/templates/${templateId}/duplicate`, {
          body: JSON.stringify({}),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }),
      );
      router.push(`/app/cadences/${template.id}/edit`);
      router.refresh();
    } catch (duplicateError) {
      setError(
        duplicateError instanceof Error
          ? duplicateError.message
          : "Không thể nhân bản quy trình.",
      );
    } finally {
      setSubmitting("");
    }
  }

  async function archiveTemplate() {
    if (!window.confirm("Lưu trữ quy trình này? Các lead đang chạy sẽ không bị xóa.")) {
      return;
    }

    setSubmitting("archive");
    setError("");

    try {
      await parseResponse(
        await fetch(`/api/cadences/templates/${templateId}`, {
          method: "DELETE",
        }),
      );
      router.push("/app/cadences");
      router.refresh();
    } catch (archiveError) {
      setError(
        archiveError instanceof Error
          ? archiveError.message
          : "Không thể lưu trữ quy trình.",
      );
    } finally {
      setSubmitting("");
    }
  }

  return (
    <>
      {error ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-mint px-4 py-2 text-sm font-bold text-ink hover:bg-[#5de0b3]"
          onClick={() => setApplyOpen(true)}
          type="button"
        >
          <PlayCircle aria-hidden="true" className="h-4 w-4" />
          Áp dụng cho lead
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink hover:border-ocean"
          disabled={submitting === "duplicate"}
          onClick={duplicateTemplate}
          type="button"
        >
          <Copy aria-hidden="true" className="h-4 w-4" />
          Nhân bản
        </button>
        {!templateIsSystem ? (
          <>
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink hover:border-ocean"
              href={`/app/cadences/${templateId}/edit`}
            >
              <Edit3 aria-hidden="true" className="h-4 w-4" />
              Sửa
            </Link>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100"
              disabled={submitting === "archive"}
              onClick={archiveTemplate}
              type="button"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              Lưu trữ
            </button>
          </>
        ) : null}
      </div>

      <ApplyCadenceModal
        defaultTemplateId={templateId}
        leadOptions={leadOptions}
        onApplied={() => router.refresh()}
        onClose={() => setApplyOpen(false)}
        open={applyOpen}
        source="cadence_template"
      />
    </>
  );
}
