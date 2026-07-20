export const LEAD_DUPLICATE_REASONS = {
  email: "Trung email",
  multiple_signals: "Trung nhieu tin hieu",
  name_address: "Trung ten va dia chi",
  phone: "Trung so dien thoai",
  website: "Trung website",
} as const;

export const DATA_QUALITY_ISSUES = {
  duplicate_possible: "Co kha nang trung",
  invalid_email: "Email khong hop le",
  invalid_phone: "So dien thoai khong hop le",
  invalid_website: "Website khong hop le",
  missing_address: "Thieu dia chi",
  missing_category: "Thieu nganh/loai khach",
  missing_email: "Thieu email",
  missing_follow_up: "Chua co lich follow-up",
  missing_phone: "Thieu so dien thoai",
  missing_status: "Thieu trang thai",
  stale_lead: "Lead lau chua cham soc",
} as const;

export const BULK_ACTION_TYPES = {
  add_tags: "Them tag",
  archive: "Luu tru",
  remove_tags: "Go tag",
  restore: "Khoi phuc",
  set_priority: "Cap nhat muc uu tien",
  soft_delete: "Xoa mem",
  update_status: "Cap nhat trang thai",
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
  address: "Dia chi",
  category: "Nganh/loai khach",
  email: "Email",
  name: "Ten lead",
  next_follow_up_at: "Follow-up tiep theo",
  note_summary: "Ghi chu tom tat",
  phone: "So dien thoai",
  priority: "Muc uu tien",
  source: "Nguon lead",
  status: "Trang thai",
  website: "Website",
};

export const DATA_QUALITY_SEVERITY_LABELS = {
  important: "Quan trong",
  info: "Thong tin",
  warning: "Can xem lai",
} as const;

export type BulkActionType = keyof typeof BULK_ACTION_TYPES;
export type DataQualityIssueType = keyof typeof DATA_QUALITY_ISSUES;
export type DuplicateReason = keyof typeof LEAD_DUPLICATE_REASONS;
export type MergeFieldOption = (typeof MERGE_FIELD_OPTIONS)[number];
