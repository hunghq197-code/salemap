export const LEAD_DUPLICATE_REASONS = {
  email: "Trùng email",
  multiple_signals: "Trùng nhiều tín hiệu",
  name_address: "Trùng tên và địa chỉ",
  phone: "Trùng số điện thoại",
  website: "Trùng website",
} as const;

export const DATA_QUALITY_ISSUES = {
  duplicate_possible: "Có khả năng trùng",
  invalid_email: "Email không hợp lệ",
  invalid_phone: "Số điện thoại không hợp lệ",
  invalid_website: "Website không hợp lệ",
  missing_address: "Thiếu địa chỉ",
  missing_category: "Thiếu ngành/loại khách",
  missing_email: "Thiếu email",
  missing_follow_up: "Chưa có lịch follow-up",
  missing_phone: "Thiếu số điện thoại",
  missing_status: "Thiếu trạng thái",
  stale_lead: "Lead lâu chưa chăm sóc",
} as const;

export const BULK_ACTION_TYPES = {
  add_tags: "Thêm tag",
  archive: "Lưu trữ",
  remove_tags: "Gỡ tag",
  restore: "Khôi phục",
  set_priority: "Cập nhật mức ưu tiên",
  soft_delete: "Xóa mềm",
  update_status: "Cập nhật trạng thái",
} as const;

export const MERGE_FIELD_OPTIONS = [
  "name",
  "phone",
  "email",
  "website",
  "address",
  "category",
  "status",
  "priority",
  "source",
  "note_summary",
  "next_follow_up_at",
] as const;

export const MERGE_FIELD_LABELS: Record<(typeof MERGE_FIELD_OPTIONS)[number], string> = {
  address: "Địa chỉ",
  category: "Ngành/loại khách",
  email: "Email",
  name: "Tên lead",
  next_follow_up_at: "Follow-up tiếp theo",
  note_summary: "Ghi chú tóm tắt",
  phone: "Số điện thoại",
  priority: "Mức ưu tiên",
  source: "Nguồn lead",
  status: "Trạng thái",
  website: "Website",
};

export const DATA_QUALITY_SEVERITY_LABELS = {
  important: "Quan trọng",
  info: "Thông tin",
  warning: "Cần xem lại",
} as const;

export type BulkActionType = keyof typeof BULK_ACTION_TYPES;
export type DataQualityIssueType = keyof typeof DATA_QUALITY_ISSUES;
export type DuplicateReason = keyof typeof LEAD_DUPLICATE_REASONS;
export type MergeFieldOption = (typeof MERGE_FIELD_OPTIONS)[number];
