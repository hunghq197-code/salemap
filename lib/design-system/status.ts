export type StatusTone =
  | "danger"
  | "neutral"
  | "primary"
  | "success"
  | "warning";

export const statusToneClasses: Record<StatusTone, string> = {
  danger: "border-danger/20 bg-danger-soft text-danger",
  neutral: "border-border-soft bg-surface-muted text-text-secondary",
  primary: "border-primary/20 bg-primary-soft text-primary",
  success: "border-success/20 bg-success-soft text-emerald-700",
  warning: "border-warning/25 bg-warning-soft text-amber-700",
};

export function getBooleanStatusTone(enabled: boolean): StatusTone {
  return enabled ? "success" : "neutral";
}
