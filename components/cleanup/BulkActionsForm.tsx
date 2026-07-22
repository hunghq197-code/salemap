"use client";

import { CheckSquare, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { LEAD_PRIORITY_OPTIONS } from "@/lib/constants/lead-priority";
import { LEAD_STATUS_OPTIONS } from "@/lib/constants/lead-status";
import { BULK_ACTION_TYPES } from "@/lib/constants/lead-cleanup";
import {
  trackBulkActionCompleted,
  trackBulkActionFailed,
  trackBulkActionStarted,
  trackBulkSelectUsed,
} from "@/lib/analytics/client";
import type { TagRecord } from "@/lib/data/tags";

type BulkActionsFormProps = {
  children: ReactNode;
  currentPageLeadIds: string[];
  tags: TagRecord[];
};

function getPayload(formData: FormData, actionType: string) {
  if (actionType === "update_status") {
    return { status: String(formData.get("status") || "contacted") };
  }

  if (actionType === "set_priority") {
    return { priority: String(formData.get("priority") || "medium") };
  }

  if (actionType === "add_tags" || actionType === "remove_tags") {
    const newTags = String(formData.get("newTags") || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    return {
      tagIds: formData.getAll("tagIds").map(String),
      tagNames: newTags,
    };
  }

  return {};
}

export function BulkActionsForm({
  children,
  currentPageLeadIds,
  tags,
}: BulkActionsFormProps) {
  const router = useRouter();
  const [selectedCount, setSelectedCount] = useState(0);
  const [actionType, setActionType] = useState("update_status");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectAll, setSelectAll] = useState(false);

  function updateSelectedCount(form: HTMLFormElement) {
    const formData = new FormData(form);
    const count = formData.getAll("leadIds").length;

    setSelectedCount(count);

    if (count > 0) {
      trackBulkSelectUsed({ selectedCount: count });
    }
  }

  function toggleSelectAll(form: HTMLFormElement, checked: boolean) {
    form
      .querySelectorAll<HTMLInputElement>('input[name="leadIds"]')
      .forEach((input) => {
        input.checked = checked;
      });
    setSelectAll(checked);
    updateSelectedCount(form);
  }

  async function submitBulkAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const leadIds = formData.getAll("leadIds").map(String);
    const confirmation = formData.get("confirmation") === "on";

    if (leadIds.length === 0) {
      setMessage("Hãy chọn ít nhất một lead.");
      return;
    }

    if (["archive", "restore", "soft_delete"].includes(actionType) && !confirmation) {
      setMessage("Cần tích xác nhận trước khi thực hiện thao tác này.");
      return;
    }

    setPending(true);
    setMessage(null);
    trackBulkActionStarted({ actionType, selectedCount: leadIds.length });

    try {
      const response = await fetch("/api/leads/bulk-actions", {
        body: JSON.stringify({
          actionType,
          confirmation,
          leadIds,
          payload: getPayload(formData, actionType),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as
        | { data?: { failedCount?: number; successCount?: number }; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(body?.error || "Không thể thực hiện thao tác hàng loạt.");
      }

      trackBulkActionCompleted({
        actionType,
        selectedCount: leadIds.length,
        successCount: body?.data?.successCount,
      });
      setMessage(`Đã xử lý ${body?.data?.successCount ?? leadIds.length} lead.`);
      form.reset();
      setSelectedCount(0);
      setSelectAll(false);
      router.refresh();
    } catch (error) {
      trackBulkActionFailed({ actionType, failedCount: leadIds.length, selectedCount: leadIds.length });
      setMessage(error instanceof Error ? error.message : "Không thể thực hiện thao tác hàng loạt.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="mt-4 space-y-4"
      onChange={(event) => updateSelectedCount(event.currentTarget)}
      onSubmit={submitBulkAction}
    >
      <div className="sticky top-20 z-20 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <label className="flex min-h-12 items-center gap-3 rounded-lg bg-cloud px-4 py-2 text-sm font-bold text-ink">
            <input
              checked={selectAll}
              className="h-5 w-5"
              onChange={(event) => toggleSelectAll(event.currentTarget.form!, event.target.checked)}
              type="checkbox"
            />
            Chọn tất cả trang này ({currentPageLeadIds.length})
          </label>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-600">Đã chọn {selectedCount} lead</p>
            <select
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base font-bold text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              name="actionType"
              onChange={(event) => setActionType(event.target.value)}
              value={actionType}
            >
              {Object.entries(BULK_ACTION_TYPES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {actionType === "update_status" ? (
            <label className="flex-1 text-sm font-bold text-ink">
              Trạng thái
              <select
                className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean"
                name="status"
              >
                {LEAD_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {actionType === "set_priority" ? (
            <label className="flex-1 text-sm font-bold text-ink">
              Ưu tiên
              <select
                className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean"
                name="priority"
              >
                {LEAD_PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {actionType === "add_tags" || actionType === "remove_tags" ? (
            <div className="grid flex-[1.4] gap-2 sm:grid-cols-2">
              <label className="text-sm font-bold text-ink">
                Tag có sẵn
                <select
                  className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean"
                  multiple
                  name="tagIds"
                >
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-bold text-ink">
                Tag mới
                <input
                  className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean"
                  name="newTags"
                  placeholder="khách cũ, tiềm năng"
                />
              </label>
            </div>
          ) : null}

          {["archive", "restore", "soft_delete"].includes(actionType) ? (
            <label className="flex flex-[1.2] items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm font-bold text-amber-900">
              <input className="mt-1 h-5 w-5" name="confirmation" type="checkbox" />
              Tôi hiểu đây là thao tác hàng loạt và có thể ảnh hưởng đến danh sách lead.
            </label>
          ) : null}

          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-bold text-white hover:bg-ocean disabled:opacity-60"
            disabled={pending || selectedCount === 0}
            type="submit"
          >
            {pending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <CheckSquare aria-hidden="true" className="h-4 w-4" />}
            Thực hiện
          </button>
        </div>
        {message ? (
          <p className="mt-3 rounded-lg bg-cloud px-3 py-2 text-sm font-semibold text-slate-700">
            {message}
          </p>
        ) : null}
      </div>

      {children}
    </form>
  );
}
