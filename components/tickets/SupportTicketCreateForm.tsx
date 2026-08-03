"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import type { SupportTicketCategory } from "@/lib/tickets/tickets";

type SupportTicketCreateFormProps = {
  categories: SupportTicketCategory[];
};

type TicketCreateResponse = {
  data?: {
    id?: string;
  };
  error?: {
    message?: string;
  };
  success?: boolean;
};

export function SupportTicketCreateForm({ categories }: SupportTicketCreateFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/support/tickets", {
      body: JSON.stringify({
        categorySlug: formData.get("categorySlug") || "",
        description: formData.get("description") || "",
        pagePath: formData.get("pagePath") || "",
        subject: formData.get("subject") || "",
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const payload = (await response.json().catch(() => null)) as TicketCreateResponse | null;

    setIsSubmitting(false);

    if (!response.ok || !payload?.success || !payload.data?.id) {
      setError(payload?.error?.message || "Không thể tạo ticket lúc này.");
      return;
    }

    router.push(`/app/support/tickets/${payload.data.id}?created=1`);
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-text-primary">
          Chủ đề
          <input
            className="min-h-11 rounded-control border border-border-soft bg-surface px-3 py-2 text-sm font-semibold text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            maxLength={160}
            name="subject"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-text-primary">
          Nhóm hỗ trợ
          <select
            className="min-h-11 rounded-control border border-border-soft bg-surface px-3 py-2 text-sm font-semibold text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            name="categorySlug"
          >
            <option value="">Chọn nhóm</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="grid gap-2 text-sm font-bold text-text-primary">
        Nội dung
        <textarea
          className="min-h-36 rounded-control border border-border-soft bg-surface px-3 py-2 text-sm font-semibold leading-6 text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          maxLength={4000}
          name="description"
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-text-primary">
        Trang đang gặp vấn đề
        <input
          className="min-h-11 rounded-control border border-border-soft bg-surface px-3 py-2 text-sm font-semibold text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          maxLength={300}
          name="pagePath"
          placeholder="/app/discover"
        />
      </label>
      {error ? (
        <p className="rounded-control bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}
      <Button loading={isSubmitting} loadingLabel="Đang tạo..." type="submit">
        Tạo ticket
      </Button>
    </form>
  );
}
