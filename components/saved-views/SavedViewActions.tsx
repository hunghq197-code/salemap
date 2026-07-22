"use client";

import { Pin, PinOff, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SavedViewActionsProps = {
  isPinned?: boolean | null;
  isSystem?: boolean | null;
  viewId: string;
};

export function SavedViewActions({ isPinned, isSystem, viewId }: SavedViewActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState<"delete" | "pin" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function togglePin() {
    setPending("pin");
    setError(null);

    try {
      const response = await fetch(`/api/leads/views/${viewId}/pin`, {
        body: JSON.stringify({ pinned: !isPinned }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(body?.error || "Không thể cập nhật ghim.");
      }

      router.refresh();
    } catch (pinError) {
      setError(pinError instanceof Error ? pinError.message : "Không thể cập nhật ghim.");
    } finally {
      setPending(null);
    }
  }

  async function deleteView() {
    if (isSystem) {
      setError("Góc nhìn thông minh mặc định không thể xóa.");
      return;
    }

    if (!window.confirm("Xóa góc nhìn lead này? Lead sẽ không bị xóa.")) {
      return;
    }

    setPending("delete");
    setError(null);

    try {
      const response = await fetch(`/api/leads/views/${viewId}`, { method: "DELETE" });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(body?.error || "Không thể xóa góc nhìn.");
      }

      router.push("/app/leads/views");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Không thể xóa góc nhìn.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <button
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink hover:border-ocean disabled:opacity-60"
        disabled={Boolean(pending)}
        onClick={togglePin}
        type="button"
      >
        {isPinned ? <PinOff aria-hidden="true" className="h-4 w-4" /> : <Pin aria-hidden="true" className="h-4 w-4" />}
        {pending === "pin" ? "Đang lưu..." : isPinned ? "Bỏ ghim" : "Ghim"}
      </button>
      <button
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
        disabled={Boolean(pending) || Boolean(isSystem)}
        onClick={deleteView}
        type="button"
      >
        <Trash2 aria-hidden="true" className="h-4 w-4" />
        {pending === "delete" ? "Đang xóa..." : "Xóa"}
      </button>
      {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}
    </div>
  );
}
