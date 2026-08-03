"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { ticketPriorityValues, ticketStatusValues } from "@/lib/tickets/ticket-status";
import type { TicketPriority, TicketStatus } from "@/lib/tickets/ticket-status";

type AdminTicketUpdateFormProps = {
  assignedAdminId?: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  ticketId: string;
};

type AdminTicketUpdateResponse = {
  error?: {
    message?: string;
  };
  success?: boolean;
};

export function AdminTicketUpdateForm({
  assignedAdminId,
  priority,
  status,
  ticketId,
}: AdminTicketUpdateFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/tickets/${ticketId}`, {
      body: JSON.stringify({
        assignedAdminId: formData.get("assignedAdminId") || "",
        priority: formData.get("priority") || priority,
        status: formData.get("status") || status,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    });
    const payload = (await response.json().catch(() => null)) as AdminTicketUpdateResponse | null;

    setIsSubmitting(false);

    if (!response.ok || !payload?.success) {
      setError(payload?.error?.message || "Không thể cập nhật ticket.");
      return;
    }

    router.refresh();
  }

  return (
    <form className="grid gap-3 md:grid-cols-3" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-bold text-ink">
        Status
        <select
          className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink"
          defaultValue={status}
          name="status"
        >
          {ticketStatusValues.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold text-ink">
        Priority
        <select
          className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink"
          defaultValue={priority}
          name="priority"
        >
          {ticketPriorityValues.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold text-ink">
        Assigned admin id
        <input
          className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink"
          defaultValue={assignedAdminId ?? ""}
          name="assignedAdminId"
          placeholder="UUID hoặc để trống"
        />
      </label>
      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 md:col-span-3">
          {error}
        </p>
      ) : null}
      <div className="md:col-span-3">
        <Button loading={isSubmitting} loadingLabel="Đang lưu..." type="submit">
          Lưu ticket
        </Button>
      </div>
    </form>
  );
}
