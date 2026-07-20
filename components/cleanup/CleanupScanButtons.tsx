"use client";

import { RefreshCw, SearchCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  trackDataQualityScanCompleted,
  trackDataQualityScanStarted,
  trackDuplicateScanCompleted,
  trackDuplicateScanStarted,
} from "@/lib/analytics/client";

type ScanState = {
  message: string;
  tone: "error" | "success";
} | null;

async function postJson(url: string) {
  const response = await fetch(url, { method: "POST" });
  const body = (await response.json().catch(() => null)) as
    | { data?: Record<string, number>; error?: string; success?: boolean }
    | null;

  if (!response.ok || !body?.success) {
    throw new Error(body?.error || "Khong the quet du lieu luc nay.");
  }

  return body.data ?? {};
}

export function CleanupScanButtons() {
  const router = useRouter();
  const [state, setState] = useState<ScanState>(null);
  const [pending, setPending] = useState<"duplicates" | "quality" | null>(null);

  async function scanDuplicates() {
    setPending("duplicates");
    setState(null);
    trackDuplicateScanStarted();

    try {
      const data = await postJson("/api/leads/cleanup/scan-duplicates");
      trackDuplicateScanCompleted({
        leadCount: data.totalPotentialDuplicates,
        successCount: data.groupsCreated,
      });
      setState({
        message: `Da tao ${data.groupsCreated ?? 0} nhom trung moi. ${data.groupsExisting ?? 0} nhom da ton tai.`,
        tone: "success",
      });
      router.refresh();
    } catch (error) {
      setState({
        message: error instanceof Error ? error.message : "Khong the quet lead trung.",
        tone: "error",
      });
    } finally {
      setPending(null);
    }
  }

  async function scanQuality() {
    setPending("quality");
    setState(null);
    trackDataQualityScanStarted();

    try {
      const data = await postJson("/api/leads/cleanup/scan-quality");
      trackDataQualityScanCompleted({
        failedCount: data.importantIssues,
        successCount: data.openIssues,
      });
      setState({
        message: `Da quet xong. Hien co ${data.openIssues ?? 0} canh bao dang mo.`,
        tone: "success",
      });
      router.refresh();
    } catch (error) {
      setState({
        message: error instanceof Error ? error.message : "Khong the quet chat luong du lieu.",
        tone: "error",
      });
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-ocean disabled:opacity-60"
          disabled={Boolean(pending)}
          onClick={scanDuplicates}
          type="button"
        >
          <SearchCheck aria-hidden="true" className="h-5 w-5" />
          {pending === "duplicates" ? "Dang quet..." : "Quet lead trung"}
        </button>
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-ink transition hover:border-ocean hover:text-ocean disabled:opacity-60"
          disabled={Boolean(pending)}
          onClick={scanQuality}
          type="button"
        >
          <RefreshCw aria-hidden="true" className="h-5 w-5" />
          {pending === "quality" ? "Dang quet..." : "Quet chat luong du lieu"}
        </button>
      </div>
      {state ? (
        <p
          className={[
            "mt-3 rounded-lg px-3 py-2 text-sm font-semibold",
            state.tone === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700",
          ].join(" ")}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
