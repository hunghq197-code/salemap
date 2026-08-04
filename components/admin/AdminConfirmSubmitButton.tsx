"use client";

import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useFormStatus } from "react-dom";

type AdminConfirmSubmitButtonProps = {
  className?: string;
  confirmMessage: string;
  icon?: "ban" | "check" | "shield" | "warning" | "x";
  label: string;
  pendingLabel?: string;
  variant?: "danger" | "neutral" | "success" | "warning";
};

const iconMap: Record<NonNullable<AdminConfirmSubmitButtonProps["icon"]>, LucideIcon> = {
  ban: Ban,
  check: CheckCircle2,
  shield: ShieldCheck,
  warning: AlertTriangle,
  x: XCircle,
};

const variantClass: Record<NonNullable<AdminConfirmSubmitButtonProps["variant"]>, string> = {
  danger: "bg-rose-600 text-white hover:bg-rose-700",
  neutral: "border border-slate-200 bg-white text-ink hover:border-ocean",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
  warning: "bg-amber-600 text-white hover:bg-amber-700",
};

export function AdminConfirmSubmitButton({
  className = "",
  confirmMessage,
  icon = "shield",
  label,
  pendingLabel = "Dang xu ly",
  variant = "neutral",
}: AdminConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();
  const Icon = pending ? Loader2 : iconMap[icon];

  return (
    <button
      className={[
        "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-70",
        variantClass[variant],
        className,
      ].join(" ")}
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      type="submit"
    >
      <Icon aria-hidden="true" className={["h-4 w-4", pending ? "animate-spin" : ""].join(" ")} />
      {pending ? pendingLabel : label}
    </button>
  );
}
