"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";

type AdminTicketReplyFormProps = {
  ticketId: string;
};

type AdminTicketReplyResponse = {
  error?: {
    message?: string;
  };
  success?: boolean;
};

export function AdminTicketReplyForm({ ticketId }: AdminTicketReplyFormProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibility, setVisibility] = useState("public");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const response = await fetch(`/api/admin/tickets/${ticketId}/messages`, {
      body: JSON.stringify({
        body,
        visibility,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const payload = (await response.json().catch(() => null)) as AdminTicketReplyResponse | null;

    setIsSubmitting(false);

    if (!response.ok || !payload?.success) {
      setError(payload?.error?.message || "Không thể gửi phản hồi.");
      return;
    }

    setBody("");
    router.refresh();
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-bold text-ink">
        Visibility
        <select
          className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink"
          onChange={(event) => setVisibility(event.target.value)}
          value={visibility}
        >
          <option value="public">Public reply</option>
          <option value="internal">Internal note</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold text-ink">
        Nội dung
        <textarea
          className="min-h-32 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold leading-6 text-ink"
          maxLength={5000}
          onChange={(event) => setBody(event.target.value)}
          required
          value={body}
        />
      </label>
      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
          {error}
        </p>
      ) : null}
      <Button loading={isSubmitting} loadingLabel="Đang gửi..." type="submit">
        Gửi
      </Button>
    </form>
  );
}
