export const CADENCE_CATEGORIES = {
  after_quote: "Sau báo giá",
  cold_lead: "Lead lạnh",
  general: "Chung",
  interested_lead: "Khách quan tâm",
  new_lead: "Lead mới",
  old_customer: "Khách cũ",
} as const;

export const CADENCE_STATUS = {
  active: "Đang chạy",
  cancelled: "Đã hủy",
  completed: "Hoàn thành",
  paused: "Tạm dừng",
} as const;

export const CADENCE_STEP_TASK_TYPES = {
  call: "Gọi điện",
  check_in: "Hỏi thăm",
  email: "Gửi email",
  follow_up: "Follow-up",
  meeting: "Hẹn gặp",
  other: "Khác",
  quote: "Gửi báo giá",
  zalo_message: "Nhắn Zalo",
} as const;

export const CADENCE_PRIORITY = {
  high: "Cao",
  low: "Thấp",
  medium: "Trung bình",
} as const;

export const CADENCE_CATEGORY_OPTIONS = Object.entries(CADENCE_CATEGORIES).map(
  ([value, label]) => ({ label, value }),
);

export const CADENCE_STATUS_OPTIONS = Object.entries(CADENCE_STATUS).map(
  ([value, label]) => ({ label, value }),
);

export const CADENCE_TASK_TYPE_OPTIONS = Object.entries(
  CADENCE_STEP_TASK_TYPES,
).map(([value, label]) => ({ label, value }));

export const CADENCE_PRIORITY_OPTIONS = Object.entries(CADENCE_PRIORITY).map(
  ([value, label]) => ({ label, value }),
);

export type CadenceCategory = keyof typeof CADENCE_CATEGORIES;
export type CadenceStatus = keyof typeof CADENCE_STATUS;
export type CadenceTaskType = keyof typeof CADENCE_STEP_TASK_TYPES;
export type CadencePriority = keyof typeof CADENCE_PRIORITY;

export function getCadenceCategoryLabel(value?: string | null) {
  return CADENCE_CATEGORIES[value as CadenceCategory] || CADENCE_CATEGORIES.general;
}

export function getCadenceStatusLabel(value?: string | null) {
  return CADENCE_STATUS[value as CadenceStatus] || value || "Chưa rõ";
}

export function getCadenceTaskTypeLabel(value?: string | null) {
  return (
    CADENCE_STEP_TASK_TYPES[value as CadenceTaskType] ||
    CADENCE_STEP_TASK_TYPES.follow_up
  );
}

export function getCadencePriorityLabel(value?: string | null) {
  return CADENCE_PRIORITY[value as CadencePriority] || CADENCE_PRIORITY.medium;
}
