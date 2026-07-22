"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LeadFilters } from "@/lib/leads/lead-filters";

type CreateSavedViewFormProps = {
  filters: LeadFilters;
  sourceLabel?: string;
};

export function CreateSavedViewForm({ filters, sourceLabel = "bộ lọc hiện tại" }: CreateSavedViewFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setPending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/leads/views", {
        body: JSON.stringify({
          description: String(formData.get("description") || ""),
          filters,
          isPinned: formData.get("isPinned") === "on",
          name: String(formData.get("name") || ""),
          sortBy: "updated_at",
          sortDirection: "desc",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as
        | { data?: { id?: string }; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(body?.error || "Không thể lưu góc nhìn.");
      }

      setMessage("Đã lưu góc nhìn lead.");
      setOpen(false);
      router.push(body?.data?.id ? `/app/leads/views/${body.data.id}` : "/app/leads/views");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể lưu góc nhìn.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <button
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ocean"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <Save aria-hidden="true" className="h-4 w-4" />
        Lưu thành góc nhìn
      </button>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Lưu {sourceLabel} để mở nhanh lần sau.
      </p>
      {open ? (
        <form action={submit} className="mt-4 grid gap-3">
          <label className="text-sm font-bold text-ink">
            Tên góc nhìn
            <input
              className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2 text-base outline-none focus:border-ocean"
              maxLength={80}
              minLength={1}
              name="name"
              placeholder="Khách cũ đang quan tâm"
              required
            />
          </label>
          <label className="text-sm font-bold text-ink">
            Mô tả
            <textarea
              className="mt-2 min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-base leading-7 outline-none focus:border-ocean"
              maxLength={300}
              name="description"
              placeholder="Dùng cho nhóm lead cần chăm sóc hằng ngày"
            />
          </label>
          <label className="flex items-center gap-3 text-sm font-bold text-ink">
            <input className="h-5 w-5" name="isPinned" type="checkbox" />
            Ghim len dashboard/sidebar
          </label>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-mint px-4 py-2 text-sm font-bold text-ink hover:bg-[#5de0b3] disabled:opacity-60"
            disabled={pending}
            type="submit"
          >
            {pending ? "Đang lưu..." : "Lưu góc nhìn"}
          </button>
        </form>
      ) : null}
      {message ? <p className="mt-3 text-sm font-semibold text-slate-700">{message}</p> : null}
    </div>
  );
}
