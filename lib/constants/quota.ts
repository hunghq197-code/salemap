export const DAILY_QUOTAS = {
  area_search: 20,
  ai_request: 10,
  export_leads: 10,
  import_rows: 5000,
  near_me_search: 20,
  route_search: 10,
  save_map_lead: 100,
} as const;

export type DailyQuotaAction = keyof typeof DAILY_QUOTAS;

export const DAILY_QUOTA_LABELS: Record<
  DailyQuotaAction,
  { label: string; shortLabel: string; unit: string }
> = {
  area_search: {
    label: "Tìm theo khu vực",
    shortLabel: "Tìm khu vực",
    unit: "lượt",
  },
  ai_request: {
    label: "Trợ lý AI",
    shortLabel: "AI",
    unit: "lượt",
  },
  export_leads: {
    label: "Xuất dữ liệu",
    shortLabel: "Export",
    unit: "lượt",
  },
  import_rows: {
    label: "Import lead",
    shortLabel: "Import",
    unit: "dòng",
  },
  near_me_search: {
    label: "Tìm quanh tôi",
    shortLabel: "Quanh tôi",
    unit: "lượt",
  },
  route_search: {
    label: "Tìm dọc tuyến",
    shortLabel: "Dọc tuyến",
    unit: "lượt",
  },
  save_map_lead: {
    label: "Lưu lead từ map",
    shortLabel: "Lưu lead",
    unit: "lead",
  },
};

export const DASHBOARD_QUOTA_ACTIONS = [
  "area_search",
  "ai_request",
  "route_search",
  "export_leads",
  "import_rows",
] as const satisfies readonly DailyQuotaAction[];

export const BILLING_QUOTA_ACTIONS = [
  "near_me_search",
  "area_search",
  "route_search",
  "save_map_lead",
  "export_leads",
  "import_rows",
  "ai_request",
] as const satisfies readonly DailyQuotaAction[];
