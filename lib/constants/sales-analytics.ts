export const ANALYTICS_PERIODS = {
  custom: { label: "Tùy chọn" },
  last_30_days: { label: "30 ngày qua" },
  last_7_days: { label: "7 ngày qua" },
  this_month: { label: "Tháng này" },
  this_week: { label: "Tuần này" },
  today: { label: "Hôm nay" },
  yesterday: { label: "Hôm qua" },
} as const;

export type AnalyticsPeriodKey = keyof typeof ANALYTICS_PERIODS;

export const SALES_METRICS = {
  ai_requests: { label: "Lượt AI", shortLabel: "AI" },
  area_searches: { label: "Tìm theo khu vực", shortLabel: "Khu vực" },
  exports_completed: { label: "Lượt xuất dữ liệu", shortLabel: "Xuất" },
  followups_completed: { label: "Follow-up hoàn thành", shortLabel: "Hoàn thành" },
  followups_created: { label: "Follow-up đã tạo", shortLabel: "Follow-up" },
  import_rows_completed: { label: "Dòng nhập thành công", shortLabel: "Nhập" },
  lead_notes_created: { label: "Ghi chú đã tạo", shortLabel: "Ghi chú" },
  leads_contacted: { label: "Lead đã liên hệ", shortLabel: "Liên hệ" },
  leads_created: { label: "Lead mới", shortLabel: "Lead mới" },
  leads_lost: { label: "Lead đã mất", shortLabel: "Đã mất" },
  leads_not_fit: { label: "Lead không phù hợp", shortLabel: "Không phù hợp" },
  leads_won: { label: "Lead đã chốt", shortLabel: "Đã chốt" },
  map_leads_saved: { label: "Lead lưu từ bản đồ", shortLabel: "Bản đồ" },
  near_me_searches: { label: "Tìm quanh tôi", shortLabel: "Gần tôi" },
  pipeline_status_changes: { label: "Cập nhật pipeline", shortLabel: "Pipeline" },
  route_searches: { label: "Tìm dọc tuyến", shortLabel: "Tuyến" },
  templates_copied: { label: "Mẫu đã sao chép", shortLabel: "Mẫu" },
} as const;

export type SalesMetricKey = keyof typeof SALES_METRICS;

export const GOAL_PERIODS = {
  custom: "Tùy chọn",
  daily: "Hằng ngày",
  monthly: "Hằng tháng",
  weekly: "Hằng tuần",
} as const;

export type GoalPeriodType = keyof typeof GOAL_PERIODS;

export const GOAL_STATUSES = {
  active: "Đang hoạt động",
  archived: "Đã lưu trữ",
  completed: "Đã hoàn thành",
  paused: "Tạm dừng",
} as const;

export type SalesGoalStatus = keyof typeof GOAL_STATUSES;

export const GOAL_TEMPLATES = {
  daily_leads: {
    description: "Giúp bạn duy trì nguồn lead mới mỗi ngày.",
    metricKey: "leads_created",
    name: "Tạo 10 lead mới mỗi ngày",
    periodType: "daily",
    targetValue: 10,
  },
  monthly_won: {
    description: "Theo dõi kết quả thực tế của pipeline mỗi tháng.",
    metricKey: "leads_won",
    name: "Chốt 5 lead mỗi tháng",
    periodType: "monthly",
    targetValue: 5,
  },
  weekly_contacts: {
    description: "Biến lead mới thành các cuộc liên hệ thực tế.",
    metricKey: "leads_contacted",
    name: "Liên hệ 30 lead mỗi tuần",
    periodType: "weekly",
    targetValue: 30,
  },
  weekly_followups: {
    description: "Giữ nhịp chăm sóc khách đã trao đổi.",
    metricKey: "followups_completed",
    name: "Hoàn thành 20 follow-up mỗi tuần",
    periodType: "weekly",
    targetValue: 20,
  },
  weekly_route_searches: {
    description: "Phủ tuyến thị trường bằng tìm kiếm dọc tuyến đều đặn.",
    metricKey: "route_searches",
    name: "Tìm 50 khách dọc tuyến mỗi tuần",
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
  contacted: "Đã liên hệ",
  follow_up: "Follow-up",
  interested: "Quan tâm",
  new: "Mới",
  won: "Đã chốt",
};

export const SOURCE_LABELS: Record<string, string> = {
  ai_created: "AI hỗ trợ",
  import_csv: "Import CSV",
  import_excel: "Import Excel",
  manual: "Thủ công",
  map_area: "Tìm theo khu vực",
  map_near_me: "Tìm quanh tôi",
  near_me: "Tìm quanh tôi",
  other: "Khác",
  route_search: "Tìm dọc tuyến",
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
