export const ANALYTICS_PERIODS = {
  custom: { label: "Tuy chon" },
  last_30_days: { label: "30 ngay qua" },
  last_7_days: { label: "7 ngay qua" },
  this_month: { label: "Thang nay" },
  this_week: { label: "Tuan nay" },
  today: { label: "Hom nay" },
  yesterday: { label: "Hom qua" },
} as const;

export type AnalyticsPeriodKey = keyof typeof ANALYTICS_PERIODS;

export const SALES_METRICS = {
  ai_requests: { label: "Luot AI", shortLabel: "AI" },
  area_searches: { label: "Tim theo khu vuc", shortLabel: "Khu vuc" },
  exports_completed: { label: "Luot export", shortLabel: "Export" },
  followups_completed: { label: "Follow-up hoan thanh", shortLabel: "Hoan thanh" },
  followups_created: { label: "Follow-up da tao", shortLabel: "Follow-up" },
  import_rows_completed: { label: "Dong import thanh cong", shortLabel: "Import" },
  lead_notes_created: { label: "Ghi chu da tao", shortLabel: "Ghi chu" },
  leads_contacted: { label: "Lead da lien he", shortLabel: "Lien he" },
  leads_created: { label: "Lead moi", shortLabel: "Lead moi" },
  leads_lost: { label: "Lead da mat", shortLabel: "Lost" },
  leads_not_fit: { label: "Lead khong phu hop", shortLabel: "Not fit" },
  leads_won: { label: "Lead da chot", shortLabel: "Won" },
  map_leads_saved: { label: "Lead luu tu ban do", shortLabel: "Ban do" },
  near_me_searches: { label: "Tim quanh toi", shortLabel: "Gan toi" },
  pipeline_status_changes: { label: "Cap nhat pipeline", shortLabel: "Pipeline" },
  route_searches: { label: "Tim doc tuyen", shortLabel: "Tuyen" },
  templates_copied: { label: "Mau da sao chep", shortLabel: "Mau" },
} as const;

export type SalesMetricKey = keyof typeof SALES_METRICS;

export const GOAL_PERIODS = {
  custom: "Tuy chon",
  daily: "Hang ngay",
  monthly: "Hang thang",
  weekly: "Hang tuan",
} as const;

export type GoalPeriodType = keyof typeof GOAL_PERIODS;

export const GOAL_STATUSES = {
  active: "Dang hoat dong",
  archived: "Da luu tru",
  completed: "Da hoan thanh",
  paused: "Tam dung",
} as const;

export type SalesGoalStatus = keyof typeof GOAL_STATUSES;

export const GOAL_TEMPLATES = {
  daily_leads: {
    description: "Giup ban duy tri dau vao moi moi ngay.",
    metricKey: "leads_created",
    name: "Tao 10 lead moi moi ngay",
    periodType: "daily",
    targetValue: 10,
  },
  monthly_won: {
    description: "Theo doi dau ra that su cua pipeline moi thang.",
    metricKey: "leads_won",
    name: "Chot 5 lead moi thang",
    periodType: "monthly",
    targetValue: 5,
  },
  weekly_contacts: {
    description: "Bien lead moi thanh cac cuoc lien he thuc te.",
    metricKey: "leads_contacted",
    name: "Lien he 30 lead moi tuan",
    periodType: "weekly",
    targetValue: 30,
  },
  weekly_followups: {
    description: "Giu nhip cham soc khach da trao doi.",
    metricKey: "followups_completed",
    name: "Hoan thanh 20 follow-up moi tuan",
    periodType: "weekly",
    targetValue: 20,
  },
  weekly_route_searches: {
    description: "Phu tuyen thi truong bang route search deu dan.",
    metricKey: "route_searches",
    name: "Tim 50 khach doc tuyen moi tuan",
    periodType: "weekly",
    targetValue: 50,
  },
} as const satisfies Record<
  string,
  {
    description: string;
    metricKey: SalesMetricKey;
    name: string;
    periodType: GoalPeriodType;
    targetValue: number;
  }
>;

export type GoalTemplateKey = keyof typeof GOAL_TEMPLATES;

export const FUNNEL_STAGES = ["new", "contacted", "interested", "follow_up", "won"] as const;

export const FUNNEL_STAGE_LABELS: Record<(typeof FUNNEL_STAGES)[number], string> = {
  contacted: "Da lien he",
  follow_up: "Follow-up",
  interested: "Quan tam",
  new: "Moi",
  won: "Da chot",
};

export const SOURCE_LABELS: Record<string, string> = {
  ai_created: "AI ho tro",
  import_csv: "Import CSV",
  import_excel: "Import Excel",
  manual: "Thu cong",
  map_area: "Tim theo khu vuc",
  map_near_me: "Tim quanh toi",
  near_me: "Tim quanh toi",
  other: "Khac",
  route_search: "Tim doc tuyen",
};

export function getSourceLabel(source?: string | null) {
  if (!source) {
    return SOURCE_LABELS.other;
  }

  return SOURCE_LABELS[source] ?? source;
}

export function getMetricLabel(metricKey: string) {
  return SALES_METRICS[metricKey as SalesMetricKey]?.label ?? metricKey;
}
