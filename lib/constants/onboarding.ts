export const ONBOARDING_ROLE_VALUES = [
  "field_sales",
  "b2b_sales",
  "distributor",
  "business_owner",
  "freelancer",
  "other",
] as const;

export const ONBOARDING_ROLE_OPTIONS = [
  { label: "Sale thị trường", value: "field_sales" },
  { label: "Sale B2B", value: "b2b_sales" },
  { label: "Nhà phân phối/đại lý", value: "distributor" },
  { label: "Chủ doanh nghiệp", value: "business_owner" },
  { label: "Freelancer/Sale dịch vụ", value: "freelancer" },
  { label: "Khác", value: "other" },
] as const;

export const ONBOARDING_INDUSTRY_VALUES = [
  "fmcg",
  "pharma",
  "building_materials",
  "equipment",
  "services",
  "real_estate",
  "education",
  "other",
] as const;

export const ONBOARDING_INDUSTRY_OPTIONS = [
  { label: "FMCG / hàng tiêu dùng", value: "fmcg" },
  { label: "Dược / nhà thuốc", value: "pharma" },
  { label: "Vật liệu xây dựng", value: "building_materials" },
  { label: "Máy móc / thiết bị", value: "equipment" },
  { label: "Dịch vụ doanh nghiệp", value: "services" },
  { label: "Bất động sản", value: "real_estate" },
  { label: "Giáo dục", value: "education" },
  { label: "Khác", value: "other" },
] as const;

export const ONBOARDING_SALES_MODEL_VALUES = [
  "field_visit",
  "phone_zalo",
  "mixed",
  "online_first",
] as const;

export const ONBOARDING_PRIMARY_GOAL_VALUES = [
  "find_new_customers",
  "manage_followups",
  "organize_leads",
  "track_sales_pipeline",
  "test_product",
] as const;

export const ONBOARDING_PRIMARY_GOAL_OPTIONS = [
  { label: "Tìm khách mới quanh khu vực", value: "find_new_customers" },
  { label: "Quản lý follow-up", value: "manage_followups" },
  { label: "Không quên chăm sóc khách", value: "organize_leads" },
  { label: "Sắp xếp pipeline bán hàng", value: "track_sales_pipeline" },
  { label: "Chỉ đang dùng thử", value: "test_product" },
] as const;

export const ONBOARDING_DIFFICULTY_VALUES = [
  "easy",
  "normal",
  "hard",
  "confusing",
] as const;

export const ACTIVATION_STEP_VALUES = [
  "searched_map",
  "saved_first_lead",
  "created_first_task",
  "applied_first_cadence",
  "completed_first_task",
  "imported_leads",
  "viewed_dashboard",
] as const;

export const CORE_ACTIVATION_STEP_VALUES = [
  "searched_map",
  "saved_first_lead",
  "created_first_task",
  "applied_first_cadence",
  "completed_first_task",
] as const;

export type ActivationStep = (typeof ACTIVATION_STEP_VALUES)[number];
export type CoreActivationStep = (typeof CORE_ACTIVATION_STEP_VALUES)[number];
export type OnboardingIndustry = (typeof ONBOARDING_INDUSTRY_VALUES)[number];
export type OnboardingPrimaryGoal = (typeof ONBOARDING_PRIMARY_GOAL_VALUES)[number];
export type OnboardingRole = (typeof ONBOARDING_ROLE_VALUES)[number];
export type OnboardingSalesModel = (typeof ONBOARDING_SALES_MODEL_VALUES)[number];

export const SALES_MODEL_BY_ROLE: Record<OnboardingRole, OnboardingSalesModel> = {
  b2b_sales: "mixed",
  business_owner: "mixed",
  distributor: "field_visit",
  field_sales: "field_visit",
  freelancer: "online_first",
  other: "mixed",
};

export const ACTIVATION_STEP_WEIGHTS: Record<CoreActivationStep, number> = {
  applied_first_cadence: 20,
  completed_first_task: 15,
  created_first_task: 20,
  saved_first_lead: 25,
  searched_map: 20,
};

export const ACTIVATION_CHECKLIST_COPY: Record<
  CoreActivationStep,
  {
    cta: string;
    description: string;
    href: string;
    title: string;
  }
> = {
  applied_first_cadence: {
    cta: "Xem quy trình",
    description: "Áp dụng một mẫu chăm sóc để SaleMap tự tạo lịch việc.",
    href: "/app/cadences",
    title: "Áp dụng quy trình chăm sóc",
  },
  completed_first_task: {
    cta: "Xem việc hôm nay",
    description: "Hoàn thành follow-up đầu tiên để đóng vòng chăm sóc.",
    href: "/app/tasks",
    title: "Hoàn thành task đầu tiên",
  },
  created_first_task: {
    cta: "Tạo việc cần làm",
    description: "Tạo một follow-up để không quên gọi lại hoặc nhắn khách.",
    href: "/app/tasks",
    title: "Tạo follow-up đầu tiên",
  },
  saved_first_lead: {
    cta: "Vào tìm khách",
    description: "Lưu một địa điểm hoặc thêm lead thủ công vào danh sách.",
    href: "/app/discover",
    title: "Lưu lead đầu tiên",
  },
  searched_map: {
    cta: "Tìm khách ngay",
    description: "Quét khách quanh bạn, theo khu vực hoặc dọc tuyến đường.",
    href: "/app/discover",
    title: "Tìm khách trên bản đồ",
  },
};
