"use client";

import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import {
  trackAdminFeedbackStatusUpdated,
  trackAdminUpgradeInterestStatusUpdated,
} from "@/lib/analytics/client";

type SelectField = {
  defaultValue?: string | null;
  label: string;
  name: string;
  options: string[];
};

type AdminInlineUpdateFormProps = {
  adminNote?: string | null;
  endpoint: string;
  eventType?: "feedback" | "upgrade_interest";
  fields: SelectField[];
  planKey?: string | null;
};

export function AdminInlineUpdateForm({
  adminNote,
  endpoint,
  eventType,
  fields,
  planKey,
}: AdminInlineUpdateFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setError("");
    setSuccess("");
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const payload: Record<string, string> = {};

    fields.forEach((field) => {
      payload[field.name] = String(formData.get(field.name) || "");
    });

    payload.adminNote = String(formData.get("adminNote") || "");

    try {
      const response = await fetch(endpoint, {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const result = (await response.json().catch(() => null)) as
        | { error?: { message?: string }; success?: boolean }
        | null;

      if (!response.ok || !result?.success) {
        setError(result?.error?.message || "Không thể cập nhật lúc này.");
        return;
      }

      if (eventType === "feedback") {
        trackAdminFeedbackStatusUpdated({
          priority: payload.priority,
          status: payload.status,
        });
      }

      if (eventType === "upgrade_interest") {
        trackAdminUpgradeInterestStatusUpdated({
          planKey: planKey || undefined,
          status: payload.status,
        });
      }

      setSuccess("Đã lưu");
      router.refresh();
    } catch {
      setError("Không thể cập nhật lúc này.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="min-w-[260px] space-y-3" onSubmit={handleSubmit}>
      {fields.map((field) => (
        <label className="block text-xs font-bold text-slate-600" key={field.name}>
          {field.label}
          <select
            className="mt-1 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
            defaultValue={field.defaultValue || ""}
            name={field.name}
          >
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      ))}

      <label className="block text-xs font-bold text-slate-600">
        Admin note
        <textarea
          className="mt-1 min-h-20 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
          defaultValue={adminNote || ""}
          maxLength={1000}
          name="adminNote"
        />
      </label>

      <button
        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white transition hover:bg-ocean disabled:opacity-70"
        disabled={isSaving}
        type="submit"
      >
        {isSaving ? (
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <Save aria-hidden="true" className="h-4 w-4" />
        )}
        Lưu
      </button>

      {success ? <p className="text-xs font-bold text-emerald-700">{success}</p> : null}
      {error ? <p className="text-xs font-bold text-rose-700">{error}</p> : null}
    </form>
  );
}
