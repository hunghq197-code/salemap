import type { DailyQuotaAction } from "@/lib/constants/quota";

export const SUBSCRIPTION_PLANS = {
  free_beta: {
    billingPeriod: "monthly",
    dailyQuotas: {
      area_search: 20,
      ai_request: 10,
      export_leads: 10,
      import_rows: 5000,
      near_me_search: 20,
      route_search: 10,
      save_map_lead: 100,
    },
    description: "Dành cho người dùng bắt đầu với SaleMap.",
    displayPrice: "0đ",
    features: [
      "20 lượt tìm quanh tôi/ngày",
      "20 lượt tìm theo khu vực/ngày",
      "10 lượt tìm dọc tuyến/ngày",
      "100 lead lưu từ map/ngày",
      "10 lượt export/ngày",
      "10 lượt AI/ngày",
      "Không giới hạn lead thủ công",
    ],
    highlighted: false,
    key: "free_beta",
    name: "Free",
    priceVnd: 0,
  },
  pro: {
    billingPeriod: "monthly",
    dailyQuotas: {
      area_search: 100,
      ai_request: 100,
      export_leads: 50,
      import_rows: 50000,
      near_me_search: 100,
      route_search: 50,
      save_map_lead: 300,
    },
    description: "Dành cho sale cá nhân dùng SaleMap hằng ngày.",
    displayPrice: "99.000đ",
    features: [
      "100 lượt tìm quanh tôi/ngày",
      "100 lượt tìm theo khu vực/ngày",
      "50 lượt tìm dọc tuyến/ngày",
      "300 lead lưu từ map/ngày",
      "50 lượt export/ngày",
      "100 lượt AI/ngày",
      "Hỗ trợ ưu tiên",
    ],
    highlighted: true,
    key: "pro",
    name: "Pro",
    priceVnd: 99000,
  },
  pro_plus: {
    billingPeriod: "monthly",
    dailyQuotas: {
      area_search: 300,
      ai_request: 300,
      export_leads: 150,
      import_rows: 200000,
      near_me_search: 300,
      route_search: 150,
      save_map_lead: 1000,
    },
    description: "Dành cho người dùng nhiều hoặc sale B2B cần tìm khách thường xuyên.",
    displayPrice: "249.000đ",
    features: [
      "300 lượt tìm quanh tôi/ngày",
      "300 lượt tìm theo khu vực/ngày",
      "150 lượt tìm dọc tuyến/ngày",
      "1.000 lead lưu từ map/ngày",
      "150 lượt export/ngày",
      "300 lượt AI/ngày",
      "Hỗ trợ onboarding riêng",
    ],
    highlighted: false,
    key: "pro_plus",
    name: "Pro Plus",
    priceVnd: 249000,
  },
} as const;

export type SubscriptionPlanKey = keyof typeof SUBSCRIPTION_PLANS;
export type PaidSubscriptionPlanKey = Exclude<SubscriptionPlanKey, "free_beta">;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[SubscriptionPlanKey];

export const PAID_SUBSCRIPTION_PLAN_KEYS = ["pro", "pro_plus"] as const;

export function isSubscriptionPlanKey(value: string): value is SubscriptionPlanKey {
  return value in SUBSCRIPTION_PLANS;
}

export function isPaidSubscriptionPlanKey(
  value: string,
): value is PaidSubscriptionPlanKey {
  return value === "pro" || value === "pro_plus";
}

export function getSubscriptionPlan(value?: string | null) {
  return isSubscriptionPlanKey(value ?? "")
    ? SUBSCRIPTION_PLANS[value as SubscriptionPlanKey]
    : SUBSCRIPTION_PLANS.free_beta;
}

export function getPlanQuotaLimit(
  planKey: string | null | undefined,
  actionType: DailyQuotaAction,
) {
  return getSubscriptionPlan(planKey).dailyQuotas[actionType];
}
