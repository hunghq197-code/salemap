"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { trackBetaChecklistItemCompleted, trackTemplateCopied } from "@/lib/analytics/client";

type TemplateCardProps = {
  body: string;
  category: string;
  title: string;
};

export function TemplateCard({ body, category, title }: TemplateCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      trackTemplateCopied(category);
      void fetch("/api/beta-checklist/complete", {
        body: JSON.stringify({ checklistKey: "copy_template" }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      })
        .then((response) => {
          if (response.ok) {
            trackBetaChecklistItemCompleted({ checklistKey: "copy_template" });
          }
        })
        .catch(() => undefined);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="relative flex min-h-[260px] flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      {copied ? (
        <div
          className="absolute right-4 top-4 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-700 shadow-sm"
          role="status"
        >
          Đã sao chép mẫu.
        </div>
      ) : null}
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-ocean">{category}</p>
      <h2 className="mt-3 text-lg font-bold leading-7 text-ink">{title}</h2>
      <p className="mt-3 flex-1 whitespace-pre-line text-sm leading-7 text-slate-600">{body}</p>
      <button
        className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-bold text-white hover:bg-ocean"
        onClick={handleCopy}
        type="button"
      >
        {copied ? (
          <Check aria-hidden="true" className="h-5 w-5" />
        ) : (
          <Copy aria-hidden="true" className="h-5 w-5" />
        )}
        {copied ? "Đã sao chép" : "Sao chép"}
      </button>
    </article>
  );
}
