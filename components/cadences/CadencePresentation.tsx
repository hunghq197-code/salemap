import {
  CheckCircle2,
  CirclePause,
  CirclePlay,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { getCadenceStatusLabel } from "@/lib/constants/cadences";

type CadenceTone = "danger" | "neutral" | "primary" | "success" | "warning";

type CadenceBadgeProps = {
  className?: string;
  status?: string | null;
};

type CadenceProgressProps = {
  completedSteps: number;
  label?: string;
  status?: string | null;
  totalSteps: number;
};

const toneClasses: Record<CadenceTone, string> = {
  danger: "border-danger/20 bg-danger-soft text-danger",
  neutral: "border-border-soft bg-surface-muted text-text-secondary",
  primary: "border-primary/20 bg-primary-soft text-primary",
  success: "border-success/20 bg-success-soft text-emerald-700",
  warning: "border-warning/25 bg-warning-soft text-amber-700",
};

const statusPresentation: Record<
  string,
  { icon: LucideIcon; tone: CadenceTone }
> = {
  active: { icon: CirclePlay, tone: "success" },
  cancelled: { icon: XCircle, tone: "danger" },
  completed: { icon: CheckCircle2, tone: "primary" },
  paused: { icon: CirclePause, tone: "warning" },
};

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

function getStatusPresentation(status?: string | null) {
  return statusPresentation[status || ""] ?? statusPresentation.active;
}

export function CadenceBadge({ className, status }: CadenceBadgeProps) {
  const presentation = getStatusPresentation(status);
  const Icon = presentation.icon;

  return (
    <span
      className={joinClasses(
        "inline-flex min-h-7 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold leading-none",
        toneClasses[presentation.tone],
        className,
      )}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {getCadenceStatusLabel(status)}
    </span>
  );
}

export function CadenceProgress({
  completedSteps,
  label = "Tiến độ cadence",
  status,
  totalSteps,
}: CadenceProgressProps) {
  const safeTotal = Math.max(0, totalSteps);
  const safeCompleted = Math.min(Math.max(0, completedSteps), safeTotal);
  const percent = safeTotal > 0 ? Math.round((safeCompleted / safeTotal) * 100) : 0;
  const presentation = getStatusPresentation(status);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs font-bold text-text-secondary">
        <span>{label}</span>
        <span className="tabular-nums text-text-primary">
          {safeCompleted}/{safeTotal} bước
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted">
        <div
          className={joinClasses(
            "h-full rounded-full transition-[width]",
            presentation.tone === "danger"
              ? "bg-danger"
              : presentation.tone === "warning"
                ? "bg-warning"
                : presentation.tone === "primary"
                  ? "bg-primary"
                  : "bg-success",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
