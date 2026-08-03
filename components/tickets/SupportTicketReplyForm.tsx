"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";

type SupportTicketReplyFormProps = {
  ticketId: string;
};

type TicketReplyResponse = {
  error?: {
    message?: string;
  };
  success?: boolean;
};

export function SupportTicketReplyForm({ ticketId }: SupportTicketReplyFormProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const response = await fetch(`/api/support/tickets/${ticketId}/messages`, {
      body: JSON.stringify({ body }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const payload = (await response.json().catch(() => null)) as TicketReplyResponse | null;

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
      <label className="grid gap-2 text-sm font-bold text-text-primary">
        Phản hồi
        <textarea
          className="min-h-28 rounded-control border border-border-soft bg-surface px-3 py-2 text-sm font-semibold leading-6 text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          maxLength={5000}
          onChange={(event) => setBody(event.target.value)}
          required
          value={body}
        />
      </label>
      {error ? (
        <p className="rounded-control bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}
      <Button loading={isSubmitting} loadingLabel="Đang gửi..." type="submit">
        Gửi phản hồi
      </Button>
    </form>
  );
}
