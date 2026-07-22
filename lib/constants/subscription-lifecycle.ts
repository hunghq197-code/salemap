export const SUBSCRIPTION_EVENT_TYPES = {
  ACTIVATED: "subscription_activated",
  CANCEL_REQUESTED: "subscription_cancel_requested",
  CANCELLED: "subscription_cancelled",
  CREATED: "subscription_created",
  DOWNGRADED_TO_FREE: "subscription_downgraded_to_free",
  EXPIRED: "subscription_expired",
  PLAN_CHANGED: "subscription_plan_changed",
  RENEWED: "subscription_renewed",
} as const;

export type SubscriptionEventType =
  (typeof SUBSCRIPTION_EVENT_TYPES)[keyof typeof SUBSCRIPTION_EVENT_TYPES];

export const CANCELLATION_REASON_OPTIONS = [
  { label: "Giá chưa phù hợp", value: "too_expensive" },
  { label: "Tôi chưa sử dụng đủ nhiều", value: "not_using_enough" },
  { label: "Thiếu tính năng tôi cần", value: "missing_feature" },
  { label: "Sản phẩm còn khó dùng", value: "hard_to_use" },
  { label: "Kết quả tìm khách chưa đủ tốt", value: "data_quality" },
  { label: "Tìm theo khu vực chưa hữu ích", value: "map_search_not_useful" },
  { label: "Tìm dọc tuyến chưa hữu ích", value: "route_search_not_useful" },
  { label: "Công ty đã có CRM/công cụ khác", value: "company_has_crm" },
  { label: "Tạm dừng, có thể quay lại sau", value: "temporary_pause" },
  { label: "Lý do khác", value: "other" },
] as const;

export type CancellationReasonType =
  (typeof CANCELLATION_REASON_OPTIONS)[number]["value"];

export const RENEWAL_REMINDER_DAYS_BEFORE = 5;
export const DEFAULT_GRACE_PERIOD_DAYS = 3;

export function isCancellationReasonType(
  value: string,
): value is CancellationReasonType {
  return CANCELLATION_REASON_OPTIONS.some((option) => option.value === value);
}
