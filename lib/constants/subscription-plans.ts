import type { DailyQuotaAction } from "@/lib/constants/quota";

export const SUBSCRIPTION_PLANS = {
  free_beta: {
    billingPeriod: "monthly",
    dailyQuotas: {
      area_search: 10,
      ai_request: 0,
      export_leads: 1,
      import_rows: 1,
      near_me_search: 10,
      route_search: 3,
      save_map_lead: 100,
    },
    description: "Dành cho người dùng bắt đầu với SaleMap.",
    displayPrice: "0đ",
    features: [
      "10 lượt tìm quanh tôi/ngày",
      "10 lượt tìm theo khu vực/ngày",
      "3 lượt tìm dọc tuyến/ngày",
      "100 lead lưu từ map",
      "1 lượt import/tháng",
      "1 lượt export/ngày",
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
      ai_request: 30,
      export_leads: 20,
      import_rows: 20,
      near_me_search: 100,
      route_search: 30,
      save_map_lead: 3000,
    },
    description: "Dành cho sale cá nhân dùng SaleMap hằng ngày.",
    displayPrice: "149.000đ",
    features: [
      "100 lượt tìm quanh tôi/ngày",
      "100 lượt tìm theo khu vực/ngày",
      "30 lượt tìm dọc tuyến/ngày",
      "3.000 lead lưu từ map",
      "20 lượt import/tháng",
      "20 lượt export/ngày",
      "30 lượt AI/ngày",
      "Hỗ trợ ưu tiên",
    ],
    highlighted: true,
    key: "pro",
    name: "Pro",
    priceVnd: 149000,
  },
  pro_plus: {
    billingPeriod: "monthly",
    dailyQuotas: {
      area_search: 500,
      ai_request: 200,
      export_leads: 100,
      import_rows: 100,
      near_me_search: 500,
      route_search: 100,
      save_map_lead: 20000,
    },
    description: "Dành cho người dùng nhiều hoặc sale B2B cần tìm khách thường xuyên.",
    displayPrice: "399.000đ",
    features: [
      "500 lượt tìm quanh tôi/ngày",
      "500 lượt tìm theo khu vực/ngày",
      "100 lượt tìm dọc tuyến/ngày",
      "20.000 lead lưu từ map",
      "100 lượt import/tháng",
      "100 lượt export/ngày",
      "200 lượt AI/ngày",
      "Hỗ trợ onboarding riêng",
    ],
    highlighted: false,
    key: "pro_plus",
    name: "Pro Plus",
    priceVnd: 399000,
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
