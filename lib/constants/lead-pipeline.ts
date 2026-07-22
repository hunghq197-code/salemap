import { LEAD_STATUSES } from "@/lib/constants/lead-status";

export const PIPELINE_COLUMNS = LEAD_STATUSES.map((status, index) => ({
  description:
    status.value === "new"
      ? "Lead vừa lưu, cần phân loại và liên hệ."
      : status.value === "contacted"
        ? "Lead đã có lần liên hệ đầu tiên."
        : status.value === "interested"
          ? "Lead có tín hiệu quan tâm."
          : status.value === "follow_up"
            ? "Lead cần hẹn lại hoặc theo sát."
            : status.value === "won"
              ? "Lead đã chốt thành công."
              : status.value === "lost"
                ? "Lead đã mất cơ hội."
                : "Lead không phù hợp để tiếp tục.",
  emptyText:
    status.value === "new"
      ? "Chưa có lead mới."
      : status.value === "contacted"
        ? "Chưa có lead đã liên hệ."
        : status.value === "interested"
          ? "Chưa có lead đang quan tâm."
          : status.value === "follow_up"
            ? "Chưa có lead cần hẹn lại."
            : status.value === "won"
              ? "Chưa có lead đã chốt."
              : status.value === "lost"
                ? "Chưa có lead đã mất."
                : "Chưa có lead không phù hợp.",
  isNegativeOutcome: status.value === "lost" || status.value === "not_fit",
  isPositiveOutcome: status.value === "won",
  key: status.value,
  label: status.label,
  sortOrder: index + 1,
})) as Array<{
  description: string;
  emptyText: string;
  isNegativeOutcome: boolean;
  isPositiveOutcome: boolean;
  key: (typeof LEAD_STATUSES)[number]["value"];
  label: string;
  sortOrder: number;
}>;

export const SMART_VIEW_DEFINITIONS = {
  imported_leads: {
    color: "#0f5f8f",
    description: "Lead được tạo từ tệp CSV hoặc Excel.",
    filters: { archived: false, deleted: false, source: ["import_csv", "import_excel"] },
    icon: "file-spreadsheet",
    name: "Lead từ tệp nhập",
  },
  interested_leads: {
    color: "#10b981",
    description: "Lead đang quan tâm hoặc cần hẹn lại.",
    filters: { archived: false, deleted: false, status: ["interested", "follow_up"] },
    icon: "sparkles",
    name: "Lead đang quan tâm",
  },
  lost_leads: {
    color: "#f43f5e",
    description: "Lead đã mất hoặc không phù hợp.",
    filters: { archived: false, deleted: false, status: ["lost", "not_fit"] },
    icon: "x-circle",
    name: "Đã mất / Không phù hợp",
  },
  map_leads: {
    color: "#0284c7",
    description: "Lead được lưu từ tìm kiếm bản đồ.",
    filters: { archived: false, deleted: false, source: ["map_near_me", "map_area"] },
    icon: "map",
    name: "Lead từ bản đồ",
  },
  new_leads: {
    color: "#64748b",
    description: "Lead mới cần được chăm sóc.",
    filters: { archived: false, deleted: false, status: ["new"] },
    icon: "plus",
    name: "Lead mới",
  },
  no_followup: {
    color: "#f59e0b",
    description: "Lead đang mở nhưng chưa có lịch hẹn tiếp theo.",
    filters: {
      archived: false,
      deleted: false,
      noFollowUp: true,
      status: ["new", "contacted", "interested", "follow_up"],
    },
    icon: "calendar-x",
    name: "Chưa có lịch follow-up",
  },
  route_leads: {
    color: "#6366f1",
    description: "Lead được lưu từ tìm kiếm dọc tuyến.",
    filters: { archived: false, deleted: false, source: ["route_search"] },
    icon: "route",
    name: "Lead từ tuyến đường",
  },
  stale_leads: {
    color: "#f97316",
    description: "Lead đã lâu chưa được chăm sóc.",
    filters: {
      archived: false,
      deleted: false,
      staleDays: 14,
      status: ["new", "contacted", "interested", "follow_up"],
    },
    icon: "clock",
    name: "Lâu chưa chăm sóc",
  },
  today_followups: {
    color: "#14b8a6",
    description: "Lead có lịch follow-up hôm nay hoặc đã quá hạn.",
    filters: { archived: false, deleted: false, followUp: "today_or_overdue" },
    icon: "bell",
    name: "Cần follow-up hôm nay",
  },
  won_leads: {
    color: "#22c55e",
    description: "Lead đã chốt thành công.",
    filters: { archived: false, deleted: false, status: ["won"] },
    icon: "check",
    name: "Đã chốt",
  },
} as const;

export const LEAD_SORT_OPTIONS = [
  { direction: "desc", label: "Mới cập nhật", value: "updated_at" },
  { direction: "desc", label: "Mới tạo", value: "created_at" },
  { direction: "asc", label: "Tạo cũ nhất", value: "created_at" },
  { direction: "asc", label: "Tên A-Z", value: "name" },
  { direction: "asc", label: "Follow-up gần nhất", value: "next_follow_up_at" },
  { direction: "desc", label: "Đổi trạng thái gần nhất", value: "status_changed_at" },
] as const;

export const LEAD_FILTER_KEYS = [
  "q",
  "status",
  "priority",
  "tags",
  "source",
  "category",
  "createdFrom",
  "createdTo",
  "followUp",
  "noFollowUp",
  "staleDays",
  "hasPhone",
  "hasEmail",
  "hasWebsite",
  "archived",
  "deleted",
] as const;

export type SmartViewKey = keyof typeof SMART_VIEW_DEFINITIONS;
