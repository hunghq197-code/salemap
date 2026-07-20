import { LEAD_STATUSES } from "@/lib/constants/lead-status";

export const PIPELINE_COLUMNS = LEAD_STATUSES.map((status, index) => ({
  description:
    status.value === "new"
      ? "Lead vua luu, can phan loai va lien he."
      : status.value === "contacted"
        ? "Lead da co lan lien he dau tien."
        : status.value === "interested"
          ? "Lead co tin hieu quan tam."
          : status.value === "follow_up"
            ? "Lead can hen lai hoac theo sat."
            : status.value === "won"
              ? "Lead da chot thanh cong."
              : status.value === "lost"
                ? "Lead da mat co hoi."
                : "Lead khong phu hop de tiep tuc.",
  emptyText:
    status.value === "new"
      ? "Chua co lead moi."
      : status.value === "contacted"
        ? "Chua co lead da lien he."
        : status.value === "interested"
          ? "Chua co lead dang quan tam."
          : status.value === "follow_up"
            ? "Chua co lead can hen lai."
            : status.value === "won"
              ? "Chua co lead da chot."
              : status.value === "lost"
                ? "Chua co lead da mat."
                : "Chua co lead khong phu hop.",
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
    description: "Lead duoc tao tu import CSV hoac Excel.",
    filters: { archived: false, deleted: false, source: ["import_csv", "import_excel"] },
    icon: "file-spreadsheet",
    name: "Lead tu import",
  },
  interested_leads: {
    color: "#10b981",
    description: "Lead dang quan tam hoac can hen lai.",
    filters: { archived: false, deleted: false, status: ["interested", "follow_up"] },
    icon: "sparkles",
    name: "Lead dang quan tam",
  },
  lost_leads: {
    color: "#f43f5e",
    description: "Lead da mat hoac khong phu hop.",
    filters: { archived: false, deleted: false, status: ["lost", "not_fit"] },
    icon: "x-circle",
    name: "Da mat / Khong phu hop",
  },
  map_leads: {
    color: "#0284c7",
    description: "Lead duoc luu tu tim kiem ban do.",
    filters: { archived: false, deleted: false, source: ["map_near_me", "map_area"] },
    icon: "map",
    name: "Lead tu ban do",
  },
  new_leads: {
    color: "#64748b",
    description: "Lead moi can duoc cham soc.",
    filters: { archived: false, deleted: false, status: ["new"] },
    icon: "plus",
    name: "Lead moi",
  },
  no_followup: {
    color: "#f59e0b",
    description: "Lead dang mo nhung chua co lich hen tiep theo.",
    filters: {
      archived: false,
      deleted: false,
      noFollowUp: true,
      status: ["new", "contacted", "interested", "follow_up"],
    },
    icon: "calendar-x",
    name: "Chua co lich follow-up",
  },
  route_leads: {
    color: "#6366f1",
    description: "Lead duoc luu tu tim kiem doc tuyen.",
    filters: { archived: false, deleted: false, source: ["route_search"] },
    icon: "route",
    name: "Lead tu tuyen duong",
  },
  stale_leads: {
    color: "#f97316",
    description: "Lead da lau chua duoc cham soc.",
    filters: {
      archived: false,
      deleted: false,
      staleDays: 14,
      status: ["new", "contacted", "interested", "follow_up"],
    },
    icon: "clock",
    name: "Lau chua cham soc",
  },
  today_followups: {
    color: "#14b8a6",
    description: "Lead co lich follow-up hom nay hoac da qua han.",
    filters: { archived: false, deleted: false, followUp: "today_or_overdue" },
    icon: "bell",
    name: "Can follow-up hom nay",
  },
  won_leads: {
    color: "#22c55e",
    description: "Lead da chot thanh cong.",
    filters: { archived: false, deleted: false, status: ["won"] },
    icon: "check",
    name: "Da chot",
  },
} as const;

export const LEAD_SORT_OPTIONS = [
  { direction: "desc", label: "Moi cap nhat", value: "updated_at" },
  { direction: "desc", label: "Moi tao", value: "created_at" },
  { direction: "asc", label: "Tao cu nhat", value: "created_at" },
  { direction: "asc", label: "Ten A-Z", value: "name" },
  { direction: "asc", label: "Follow-up gan nhat", value: "next_follow_up_at" },
  { direction: "desc", label: "Doi status gan nhat", value: "status_changed_at" },
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
