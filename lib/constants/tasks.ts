export const TASK_TYPES = [
  { label: "Follow-up", value: "follow_up" },
  { label: "Gọi điện", value: "call" },
  { label: "Nhắn Zalo", value: "zalo_message" },
  { label: "Gửi email", value: "email" },
  { label: "Gặp trực tiếp", value: "meeting" },
  { label: "Gửi báo giá", value: "quote" },
  { label: "Hỏi thăm", value: "check_in" },
  { label: "Khác", value: "other" },
] as const;

export const TASK_STATUS = [
  { label: "Chưa làm", value: "pending" },
  { label: "Hoàn thành", value: "completed" },
  { label: "Đã dời lịch", value: "snoozed" },
  { label: "Đã hủy", value: "cancelled" },
] as const;

export const TASK_PRIORITY = [
  {
    badgeClass: "border-slate-200 bg-slate-100 text-slate-600",
    label: "Thấp",
    value: "low",
  },
  {
    badgeClass: "border-sky-200 bg-sky-50 text-sky-700",
    label: "Trung bình",
    value: "medium",
  },
  {
    badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
    label: "Cao",
    value: "high",
  },
] as const;

export const TASK_TABS = [
  { label: "Hôm nay", value: "today" },
  { label: "Quá hạn", value: "overdue" },
  { label: "Sắp tới", value: "upcoming" },
  { label: "Chưa có lịch", value: "no_schedule" },
  { label: "Đã hoàn thành", value: "completed" },
] as const;

export const DEFAULT_TASK_SUGGESTIONS = [
  "Gọi lần đầu",
  "Nhắn Zalo giới thiệu",
  "Follow-up sau báo giá",
  "Hẹn gặp",
  "Hỏi lại nhu cầu",
  "Chốt lịch tư vấn",
] as const;

export const TASK_OUTCOMES = [
  { label: "Đã gọi thành công", suggestedStatus: "contacted", value: "call_success" },
  { label: "Không nghe máy", suggestedStatus: "follow_up", value: "no_answer" },
  { label: "Đã nhắn Zalo", suggestedStatus: "contacted", value: "zalo_sent" },
  { label: "Đã gửi báo giá", suggestedStatus: "follow_up", value: "quote_sent" },
  { label: "Khách quan tâm", suggestedStatus: "interested", value: "interested" },
  { label: "Khách hẹn lại", suggestedStatus: "follow_up", value: "callback" },
  { label: "Không phù hợp", suggestedStatus: "not_fit", value: "not_fit" },
  { label: "Đã chốt", suggestedStatus: "won", value: "won" },
  { label: "Khác", suggestedStatus: undefined, value: "other" },
] as const;

export const ACTIVE_TASK_STATUSES = ["pending", "snoozed"] as const;
export const COMPLETED_TASK_STATUSES = ["completed", "done"] as const;
export const ACTIVE_LEAD_STATUSES_FOR_TASKS = [
  "new",
  "contacted",
  "interested",
  "follow_up",
] as const;

export type TaskType = (typeof TASK_TYPES)[number]["value"];
export type TaskStatus = (typeof TASK_STATUS)[number]["value"];
export type TaskPriority = (typeof TASK_PRIORITY)[number]["value"];
export type TaskTab = (typeof TASK_TABS)[number]["value"];
export type TaskOutcome = (typeof TASK_OUTCOMES)[number]["value"];

export function getTaskTypeOption(value?: string | null) {
  return TASK_TYPES.find((option) => option.value === value) || TASK_TYPES[0];
}

export function getTaskPriorityOption(value?: string | null) {
  return TASK_PRIORITY.find((option) => option.value === value) || TASK_PRIORITY[1];
}

export function getTaskStatusLabel(value?: string | null) {
  if (value === "done") return "Hoàn thành";
  return TASK_STATUS.find((option) => option.value === value)?.label || "Chưa làm";
}

export function getTaskOutcomeOption(value?: string | null) {
  return TASK_OUTCOMES.find((option) => option.value === value) || TASK_OUTCOMES[8];
}
