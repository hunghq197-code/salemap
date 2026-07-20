"use client";

import { Copy } from "lucide-react";
import { useState } from "react";

type AdminCopyButtonProps = {
  value: string;
};

export function AdminCopyButton({ value }: AdminCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-ink transition hover:border-ocean hover:text-ocean"
      onClick={handleCopy}
      type="button"
    >
      <Copy aria-hidden="true" className="h-3.5 w-3.5" />
      {copied ? "Đã copy" : "Copy"}
    </button>
  );
}
