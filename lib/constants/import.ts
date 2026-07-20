import type { SubscriptionPlanKey } from "@/lib/constants/subscription-plans";

export type ImportableLeadFieldKey =
  | "address"
  | "category"
  | "email"
  | "initial_note"
  | "name"
  | "next_follow_up_at"
  | "phone"
  | "priority"
  | "source"
  | "status"
  | "tags"
  | "website";

export type DuplicateStrategy = "create_new" | "skip" | "update_existing";

export const IMPORT_FILE_LIMITS: Record<
  SubscriptionPlanKey,
  { maxFileSizeBytes: number; maxRows: number; monthlyRows: number }
> = {
  free_beta: {
    maxFileSizeBytes: 10 * 1024 * 1024,
    maxRows: 5000,
    monthlyRows: 5000,
  },
  pro: {
    maxFileSizeBytes: 10 * 1024 * 1024,
    maxRows: 20000,
    monthlyRows: 50000,
  },
  pro_plus: {
    maxFileSizeBytes: 10 * 1024 * 1024,
    maxRows: 50000,
    monthlyRows: 200000,
  },
};

export const IMPORTABLE_LEAD_FIELDS: Array<{
  aliases: string[];
  key: ImportableLeadFieldKey;
  label: string;
  required: false;
}> = [
  {
    aliases: [
      "name",
      "ten",
      "tên",
      "ten khach",
      "tên khách",
      "khach hang",
      "khách hàng",
      "company",
      "cong ty",
      "công ty",
    ],
    key: "name",
    label: "Tên khách",
    required: false,
  },
  {
    aliases: ["phone", "sdt", "sđt", "so dien thoai", "số điện thoại", "mobile", "tel"],
    key: "phone",
    label: "Số điện thoại",
    required: false,
  },
  {
    aliases: ["email", "mail", "e-mail"],
    key: "email",
    label: "Email",
    required: false,
  },
  {
    aliases: ["website", "web", "url", "domain"],
    key: "website",
    label: "Website",
    required: false,
  },
  {
    aliases: ["address", "dia chi", "địa chỉ", "location", "địa điểm"],
    key: "address",
    label: "Địa chỉ",
    required: false,
  },
  {
    aliases: ["category", "nganh", "ngành", "loai khach", "loại khách", "industry"],
    key: "category",
    label: "Ngành / Loại khách",
    required: false,
  },
  {
    aliases: ["status", "trang thai", "trạng thái"],
    key: "status",
    label: "Trạng thái",
    required: false,
  },
  {
    aliases: ["priority", "uu tien", "ưu tiên"],
    key: "priority",
    label: "Mức ưu tiên",
    required: false,
  },
  {
    aliases: ["source", "nguon", "nguồn"],
    key: "source",
    label: "Nguồn lead",
    required: false,
  },
  {
    aliases: ["note", "notes", "ghi chu", "ghi chú", "remark"],
    key: "initial_note",
    label: "Ghi chú",
    required: false,
  },
  {
    aliases: ["follow up", "follow-up", "ngay hen", "ngày hẹn", "nhac viec", "nhắc việc"],
    key: "next_follow_up_at",
    label: "Ngày follow-up",
    required: false,
  },
  {
    aliases: ["tag", "tags", "nhom", "nhóm"],
    key: "tags",
    label: "Tag",
    required: false,
  },
] as const;

export const DUPLICATE_STRATEGIES: Array<{
  description: string;
  key: DuplicateStrategy;
  label: string;
}> = [
  {
    description: "Không tạo lead mới nếu tìm thấy lead có khả năng trùng.",
    key: "skip",
    label: "Bỏ qua dòng trùng",
  },
  {
    description: "Cập nhật lead hiện có bằng dữ liệu mới trong file.",
    key: "update_existing",
    label: "Cập nhật lead hiện có",
  },
  {
    description: "Vẫn tạo lead mới dù có khả năng trùng.",
    key: "create_new",
    label: "Vẫn tạo lead mới",
  },
];

export const IMPORT_JOB_STATUSES = [
  "uploaded",
  "previewed",
  "mapped",
  "validated",
  "importing",
  "completed",
  "failed",
  "cancelled",
] as const;

export const IMPORT_ROW_STATUSES = [
  "pending",
  "valid",
  "invalid",
  "duplicate",
  "imported",
  "skipped",
  "updated",
  "failed",
] as const;

export type ImportJobStatus = (typeof IMPORT_JOB_STATUSES)[number];
export type ImportRowStatus = (typeof IMPORT_ROW_STATUSES)[number];

export function isImportableLeadFieldKey(value: string | null | undefined): value is ImportableLeadFieldKey {
  return IMPORTABLE_LEAD_FIELDS.some((field) => field.key === value);
}

export function isDuplicateStrategy(value: string | null | undefined): value is DuplicateStrategy {
  return DUPLICATE_STRATEGIES.some((strategy) => strategy.key === value);
}
