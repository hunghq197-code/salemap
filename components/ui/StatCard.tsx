import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

type StatTone = "danger" | "neutral" | "primary" | "success" | "warning";

type StatCardProps = {
  description?: string;
  icon: LucideIcon;
  label: string;
  meta?: ReactNode;
  tone?: StatTone;
  value: number | string;
};

const toneClasses: Record<StatTone, string> = {
  danger: "bg-danger-soft text-danger",
  neutral: "bg-surface-muted text-text-secondary",
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-emerald-700",
  warning: "bg-warning-soft text-amber-700",
};

export function StatCard({
  description,
  icon: Icon,
  label,
  meta,
  tone = "primary",
  value,
}: StatCardProps) {
  return (
    <Card as="article" className="min-h-[154px]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-text-secondary">{label}</p>
          <p className="mt-3 text-3xl font-bold tabular-nums text-text-primary">
            {value}
          </p>
        </div>
        <span
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-control",
            toneClasses[tone],
          ].join(" ")}
        >
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>
      {description ? (
        <p className="mt-3 text-sm leading-6 text-text-secondary">{description}</p>
      ) : null}
      {meta ? <div className="mt-3 text-xs font-bold text-text-muted">{meta}</div> : null}
    </Card>
  );
}
