"use client";

import { Eye, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { trackDuplicateGroupDismissed } from "@/lib/analytics/client";

type DuplicateGroupActionsProps = {
  groupId: string;
};

export function DuplicateGroupActions({ groupId }: DuplicateGroupActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function dismissGroup() {
    if (!window.confirm("Bo qua nhom trung nay? Lead se khong bi xoa.")) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/leads/cleanup/merge-groups/${groupId}`, {
        body: JSON.stringify({ action: "dismiss" }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(body?.error || "Khong the bo qua nhom nay.");
      }

      trackDuplicateGroupDismissed();
      router.refresh();
    } catch (dismissError) {
      setError(dismissError instanceof Error ? dismissError.message : "Khong the bo qua nhom.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Link
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ocean"
        href={`/app/leads/cleanup/duplicates/${groupId}`}
      >
        <Eye aria-hidden="true" className="h-4 w-4" />
        Xem & gop
      </Link>
      <button
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink hover:border-rose-300 hover:text-rose-700 disabled:opacity-60"
        disabled={pending}
        onClick={dismissGroup}
        type="button"
      >
        <XCircle aria-hidden="true" className="h-4 w-4" />
        {pending ? "Dang bo qua..." : "Bo qua"}
      </button>
      {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}
    </div>
  );
}
