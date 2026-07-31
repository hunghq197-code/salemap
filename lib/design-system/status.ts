import {
  CheckCircle2,
  Circle,
  CircleDot,
  Handshake,
  PhoneCall,
  RotateCcw,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { getLeadStatusOption } from "@/lib/constants/lead-status";

export type StatusTone =
  | "danger"
  | "neutral"
  | "primary"
  | "success"
  | "warning";

export type LeadStatusPresentation = {
  badgeVariant: StatusTone;
  description?: string;
  icon: LucideIcon;
  label: string;
};

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

const leadStatusPresentation: Record<string, Omit<LeadStatusPresentation, "label">> = {
  contacted: {
    badgeVariant: "primary",
    description: "Đã có lần liên hệ đầu tiên.",
    icon: PhoneCall,
  },
  follow_up: {
    badgeVariant: "warning",
    description: "Cần hẹn lại hoặc theo sát.",
    icon: RotateCcw,
  },
  interested: {
    badgeVariant: "success",
    description: "Có tín hiệu quan tâm.",
    icon: Handshake,
  },
  lost: {
    badgeVariant: "danger",
    description: "Đã mất cơ hội.",
    icon: XCircle,
  },
  new: {
    badgeVariant: "neutral",
    description: "Lead vừa lưu, cần phân loại và liên hệ.",
    icon: Circle,
  },
  not_fit: {
    badgeVariant: "danger",
    description: "Không phù hợp để tiếp tục.",
    icon: CircleDot,
  },
  won: {
    badgeVariant: "success",
    description: "Đã chốt thành công.",
    icon: CheckCircle2,
  },
};

export function getLeadStatusPresentation(
  status?: string | null,
): LeadStatusPresentation {
  const option = getLeadStatusOption(status);
  const presentation =
    leadStatusPresentation[option.value] ?? leadStatusPresentation.new;

  return {
    ...presentation,
    label: option.label,
  };
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
