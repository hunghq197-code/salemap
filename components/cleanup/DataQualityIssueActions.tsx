"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  trackDataQualityIssueDismissed,
  trackDataQualityIssueResolved,
} from "@/lib/analytics/client";

type DataQualityIssueActionsProps = {
  issueId: string;
  issueType?: string | null;
  severity?: string | null;
};

export function DataQualityIssueActions({
  issueId,
  issueType,
  severity,
}: DataQualityIssueActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState<"dismiss" | "resolve" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateIssue(action: "dismiss" | "resolve") {
    setPending(action);
    setError(null);

    try {
      const response = await fetch(`/api/leads/cleanup/issues/${issueId}`, {
        body: JSON.stringify({ action }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(body?.error || "Khong the cap nhat canh bao.");
      }

      if (action === "resolve") {
        trackDataQualityIssueResolved({ issueType: issueType ?? undefined, severity: severity ?? undefined });
      } else {
        trackDataQualityIssueDismissed({ issueType: issueType ?? undefined, severity: severity ?? undefined });
      }

      router.refresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Khong the cap nhat canh bao.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <button
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-mint px-3 py-2 text-sm font-bold text-ink hover:bg-[#5de0b3] disabled:opacity-60"
        disabled={Boolean(pending)}
        onClick={() => updateIssue("resolve")}
        type="button"
      >
        <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
        {pending === "resolve" ? "Dang xu ly..." : "Da xu ly"}
      </button>
      <button
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink hover:border-ocean disabled:opacity-60"
        disabled={Boolean(pending)}
        onClick={() => updateIssue("dismiss")}
        type="button"
      >
        <XCircle aria-hidden="true" className="h-4 w-4" />
        {pending === "dismiss" ? "Dang bo qua..." : "Bo qua"}
      </button>
      {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}
    </div>
  );
}
