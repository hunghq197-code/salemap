import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

export const TOAST_MESSAGES = {
  error: "Không thể lưu dữ liệu. Vui lòng thử lại.",
  lead_archived: "Đã archive lead.",
  lead_created: "Đã thêm lead mới.",
  lead_deleted: "Đã xóa mềm lead.",
  lead_invalid: "Thông tin lead chưa hợp lệ. Vui lòng kiểm tra lại.",
  lead_note_created: "Đã lưu ghi chú.",
  lead_note_with_reminder_created: "Đã lưu ghi chú và tạo lịch follow-up.",
  lead_updated: "Đã cập nhật lead.",
  reminder_completed: "Đã hoàn thành follow-up.",
  reminder_created: "Đã tạo follow-up.",
  reminder_snoozed: "Đã dời lịch follow-up.",
  notification_all_marked_read: "Đã đánh dấu tất cả thông báo là đã đọc.",
  notification_marked_read: "Đã đánh dấu thông báo là đã đọc.",
  notification_settings_failed: "Không thể lưu cài đặt thông báo lúc này.",
  notification_settings_updated: "Đã lưu cài đặt thông báo.",
  invalid_goal: "Mục tiêu chưa hợp lệ. Vui lòng kiểm tra lại.",
  sample_data_created: "Đã tạo dữ liệu mẫu.",
  sample_data_failed: "Không thể tạo dữ liệu mẫu lúc này.",
  sales_analytics_rebuilt: "Đã cập nhật lại số liệu hiệu suất 30 ngày gần nhất.",
  sales_goal_archived: "Đã lưu trữ mục tiêu.",
  sales_goal_created: "Đã tạo mục tiêu cá nhân.",
  sales_goal_updated: "Đã cập nhật mục tiêu.",
  sample_data_skipped: "Bạn đã có dữ liệu lead, không cần tạo dữ liệu mẫu.",
  template_copied: "Đã sao chép mẫu.",
} as const;

export type ToastCode = keyof typeof TOAST_MESSAGES;

export type ToastEventDescriptor =
  | string
  | {
      eventName: string;
      properties?: Record<string, unknown>;
    };

export const TOAST_EVENT_MAP: Partial<
  Record<ToastCode, ToastEventDescriptor | ToastEventDescriptor[]>
> = {
  lead_archived: ANALYTICS_EVENTS.LEAD_ARCHIVED,
  lead_created: [
    ANALYTICS_EVENTS.LEAD_CREATED,
    {
      eventName: ANALYTICS_EVENTS.BETA_CHECKLIST_ITEM_COMPLETED,
      properties: { checklistKey: "create_first_lead" },
    },
  ],
  lead_note_created: [
    ANALYTICS_EVENTS.LEAD_NOTE_CREATED,
    {
      eventName: ANALYTICS_EVENTS.BETA_CHECKLIST_ITEM_COMPLETED,
      properties: { checklistKey: "add_first_note" },
    },
  ],
  lead_note_with_reminder_created: [
    ANALYTICS_EVENTS.LEAD_NOTE_CREATED,
    ANALYTICS_EVENTS.REMINDER_CREATED,
    {
      eventName: ANALYTICS_EVENTS.BETA_CHECKLIST_ITEM_COMPLETED,
      properties: { checklistKey: "add_first_note" },
    },
    {
      eventName: ANALYTICS_EVENTS.BETA_CHECKLIST_ITEM_COMPLETED,
      properties: { checklistKey: "create_first_reminder" },
    },
  ],
  lead_updated: ANALYTICS_EVENTS.LEAD_UPDATED,
  notification_all_marked_read: ANALYTICS_EVENTS.NOTIFICATION_ALL_MARKED_READ,
  notification_marked_read: ANALYTICS_EVENTS.NOTIFICATION_MARKED_READ,
  notification_settings_updated: ANALYTICS_EVENTS.NOTIFICATION_SETTINGS_UPDATED,
  reminder_completed: ANALYTICS_EVENTS.REMINDER_COMPLETED,
  reminder_created: [
    ANALYTICS_EVENTS.REMINDER_CREATED,
    {
      eventName: ANALYTICS_EVENTS.BETA_CHECKLIST_ITEM_COMPLETED,
      properties: { checklistKey: "create_first_reminder" },
    },
  ],
  sample_data_created: ANALYTICS_EVENTS.SAMPLE_DATA_CREATED,
  sample_data_failed: ANALYTICS_EVENTS.SAMPLE_DATA_CREATE_FAILED,
  sales_analytics_rebuilt: ANALYTICS_EVENTS.SALES_ANALYTICS_REBUILD_CLICKED,
  sales_goal_archived: ANALYTICS_EVENTS.SALES_GOAL_ARCHIVED,
  sales_goal_created: ANALYTICS_EVENTS.SALES_GOAL_CREATED,
  sales_goal_updated: ANALYTICS_EVENTS.SALES_GOAL_UPDATED,
  template_copied: [
    ANALYTICS_EVENTS.TEMPLATE_COPIED,
    {
      eventName: ANALYTICS_EVENTS.BETA_CHECKLIST_ITEM_COMPLETED,
      properties: { checklistKey: "copy_template" },
    },
  ],
};

export function isToastCode(value?: string | string[] | null): value is ToastCode {
  return typeof value === "string" && value in TOAST_MESSAGES;
}

export function getToastMessage(value?: string | string[] | null) {
  return isToastCode(value) ? TOAST_MESSAGES[value] : null;
}
