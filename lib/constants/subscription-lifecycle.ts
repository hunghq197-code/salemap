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
  { label: "Gia chua phu hop", value: "too_expensive" },
  { label: "Toi chua dung du nhieu", value: "not_using_enough" },
  { label: "Thieu tinh nang toi can", value: "missing_feature" },
  { label: "San pham con kho dung", value: "hard_to_use" },
  { label: "Ket qua tim khach chua du tot", value: "data_quality" },
  { label: "Tim theo khu vuc chua huu ich", value: "map_search_not_useful" },
  { label: "Tim doc tuyen chua huu ich", value: "route_search_not_useful" },
  { label: "Cong ty da co CRM/cong cu khac", value: "company_has_crm" },
  { label: "Tam dung, co the quay lai sau", value: "temporary_pause" },
  { label: "Ly do khac", value: "other" },
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
