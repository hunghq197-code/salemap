import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type DashboardStatTone = "danger" | "primary" | "success" | "warning";

type DashboardStatCardProps = {
  description: string;
  href?: string;
  icon: LucideIcon;
  label: string;
  tone?: DashboardStatTone;
  value: number;
};

const toneClasses: Record<DashboardStatTone, string> = {
  danger: "bg-danger-soft text-danger",
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-emerald-700",
  warning: "bg-warning-soft text-amber-700",
};

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function DashboardStatCard({
  description,
  href,
  icon: Icon,
  label,
  tone = "primary",
  value,
}: DashboardStatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold leading-5 text-text-secondary sm:text-sm">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-text-primary sm:text-3xl">
            {value}
          </p>
        </div>
        <span
          className={joinClasses(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-control sm:h-11 sm:w-11",
            toneClasses[tone],
          )}
        >
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-text-secondary sm:text-sm sm:leading-6">
        {description}
      </p>
    </>
  );

  const className =
    "rounded-card border border-border-soft bg-surface p-3 shadow-card transition sm:min-h-[154px] sm:p-5";

  if (href) {
    return (
      <Link className={`${className} block hover:border-primary/40`} href={href}>
        {content}
      </Link>
    );
  }

  return <article className={className}>{content}</article>;
}
