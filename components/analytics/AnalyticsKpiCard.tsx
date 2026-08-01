import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type KpiTone = "danger" | "neutral" | "primary" | "success" | "warning";

type AnalyticsKpiCardProps = {
  actionHref?: string;
  actionLabel?: string;
  description: string;
  icon: LucideIcon;
  label: string;
  meta?: string | null;
  tone?: KpiTone;
  value: number | string;
};

const toneClasses: Record<KpiTone, string> = {
  danger: "bg-danger-soft text-danger",
  neutral: "bg-surface-muted text-text-secondary",
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-emerald-700",
  warning: "bg-warning-soft text-amber-700",
};

export function AnalyticsKpiCard({
  actionHref,
  actionLabel,
  description,
  icon: Icon,
  label,
  meta,
  tone = "primary",
  value,
}: AnalyticsKpiCardProps) {
  return (
    <article className="rounded-card border border-border-soft bg-surface p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-text-secondary">{label}</p>
          <p className="mt-3 text-3xl font-bold tabular-nums text-text-primary">{value}</p>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-control ${toneClasses[tone]}`}>
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-text-secondary">{description}</p>
      {meta ? <p className="mt-2 text-xs font-bold text-text-muted">{meta}</p> : null}
      {actionHref && actionLabel ? (
        <Link
          className="mt-4 inline-flex min-h-10 items-center justify-center rounded-control border border-border-soft bg-surface px-4 py-2 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
          href={actionHref}
        >
          {actionLabel}
        </Link>
      ) : null}
    </article>
  );
}
