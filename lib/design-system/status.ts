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

export function getLeadStatusTone(status?: string | null): StatusTone {
  if (status === "won" || status === "interested") return "success";
  if (status === "follow_up") return "warning";
  if (status === "lost" || status === "not_fit") return "danger";
  if (status === "contacted") return "primary";
  return "neutral";
}

export function getTaskStatusTone(status?: string | null): StatusTone {
  if (status === "completed" || status === "done") return "success";
  if (status === "snoozed") return "warning";
  if (status === "cancelled") return "danger";
  return "neutral";
}

export function getPriorityTone(priority?: string | null): StatusTone {
  if (priority === "high") return "danger";
  if (priority === "medium") return "primary";
  return "neutral";
}
