export const EXPORT_FIELDS = [
  { key: "name", label: "Tên lead" },
  { key: "phone", label: "Số điện thoại" },
  { key: "email", label: "Email" },
  { key: "website", label: "Website" },
  { key: "address", label: "Địa chỉ" },
  { key: "category", label: "Ngành/loại khách" },
  { key: "status", label: "Trạng thái" },
  { key: "priority", label: "Mức ưu tiên" },
  { key: "source", label: "Nguồn lead" },
  { key: "note_summary", label: "Ghi chú tóm tắt" },
  { key: "next_follow_up_at", label: "Follow-up tiếp theo" },
  { key: "created_at", label: "Ngày tạo" },
] as const;

export type ExportFieldKey = (typeof EXPORT_FIELDS)[number]["key"];

export const DEFAULT_EXPORT_FIELDS: ExportFieldKey[] = [
  "name",
  "phone",
  "address",
  "status",
  "source",
  "note_summary",
  "next_follow_up_at",
  "created_at",
];

export const EXPORT_FIELD_LABELS = Object.fromEntries(
  EXPORT_FIELDS.map((field) => [field.key, field.label]),
) as Record<ExportFieldKey, string>;

export const SOURCE_OPTIONS = [
  { value: "manual", label: "Thủ công" },
  { value: "map_near_me", label: "Tìm quanh tôi" },
  { value: "map_area", label: "Tìm theo khu vực" },
  { value: "route_search", label: "Tìm dọc tuyến" },
] as const;

export function isExportFieldKey(value: string): value is ExportFieldKey {
  return EXPORT_FIELDS.some((field) => field.key === value);
}

export function getSourceLabel(source?: string | null) {
  return SOURCE_OPTIONS.find((option) => option.value === source)?.label || "Thủ công";
}
