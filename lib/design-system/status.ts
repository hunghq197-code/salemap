import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Circle,
  CircleDot,
  Clock3,
  Handshake,
  Hourglass,
  PhoneCall,
  RotateCcw,
  ShieldCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { PaymentStatus, SubscriptionStatus } from "@/lib/billing/types";
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

export type BillingStatusPresentation = {
  badgeVariant: StatusTone;
  description: string;
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

const subscriptionStatusPresentation: Record<
  SubscriptionStatus,
  BillingStatusPresentation
> = {
  active: {
    badgeVariant: "success",
    description: "Gói đang có hiệu lực theo kỳ hiện tại.",
    icon: CheckCircle2,
    label: "Đang hoạt động",
  },
  cancelled: {
    badgeVariant: "danger",
    description: "Gói đã bị hủy. Quyền lợi trả về theo chính sách hiện tại.",
    icon: Ban,
    label: "Đã hủy",
  },
  expired: {
    badgeVariant: "danger",
    description: "Gói đã hết hạn. Hạn mức được tính theo Free.",
    icon: XCircle,
    label: "Đã hết hạn",
  },
  free: {
    badgeVariant: "neutral",
    description: "Tài khoản đang dùng gói Free.",
    icon: Circle,
    label: "Free",
  },
  grace: {
    badgeVariant: "warning",
    description: "Gói đang trong thời gian gia hạn xử lý sau khi hết kỳ.",
    icon: Hourglass,
    label: "Gia hạn xử lý",
  },
  past_due: {
    badgeVariant: "warning",
    description: "Thanh toán quá hạn. Hệ thống chưa tự gia hạn nếu chưa có recurring.",
    icon: AlertCircle,
    label: "Quá hạn",
  },
  trialing: {
    badgeVariant: "primary",
    description: "Gói trial đang có hiệu lực trong thời hạn được cấp.",
    icon: ShieldCheck,
    label: "Trial",
  },
};

export function getSubscriptionStatusPresentation(
  status?: string | null,
): BillingStatusPresentation {
  return (
    subscriptionStatusPresentation[status as SubscriptionStatus] ??
    subscriptionStatusPresentation.free
  );
}

const paymentStatusPresentation: Record<PaymentStatus, BillingStatusPresentation> = {
  cancelled: {
    badgeVariant: "danger",
    description: "Payment đã bị hủy. Subscription không thay đổi.",
    icon: XCircle,
    label: "Đã hủy",
  },
  expired: {
    badgeVariant: "danger",
    description: "Payment đã hết hạn. Cần tạo payment mới nếu muốn tiếp tục.",
    icon: XCircle,
    label: "Hết hạn",
  },
  failed: {
    badgeVariant: "danger",
    description: "Payment thất bại hoặc bị từ chối khi đối soát.",
    icon: XCircle,
    label: "Thất bại",
  },
  paid: {
    badgeVariant: "success",
    description: "Server đã xác nhận thanh toán hợp lệ và xử lý subscription.",
    icon: CheckCircle2,
    label: "Đã thanh toán",
  },
  pending: {
    badgeVariant: "neutral",
    description: "Payment đã được tạo nhưng chưa có xác nhận chuyển khoản/webhook.",
    icon: Clock3,
    label: "Chờ thanh toán",
  },
  processing: {
    badgeVariant: "primary",
    description: "Provider đang xử lý. Return page không tự kích hoạt gói.",
    icon: RotateCcw,
    label: "Đang xử lý",
  },
  refunded: {
    badgeVariant: "warning",
    description: "Payment đã được hoàn tiền hoặc cần đối soát hoàn tiền.",
    icon: RotateCcw,
    label: "Đã hoàn tiền",
  },
  waiting_confirmation: {
    badgeVariant: "warning",
    description: "Người dùng đã báo chuyển khoản. Admin cần đối soát trước khi kích hoạt.",
    icon: Hourglass,
    label: "Chờ xác nhận",
  },
};

export function getPaymentStatusPresentation(
  status?: string | null,
): BillingStatusPresentation {
  return (
    paymentStatusPresentation[status as PaymentStatus] ??
    paymentStatusPresentation.pending
  );
}
