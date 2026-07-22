import {
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanKey,
} from "@/lib/constants/subscription-plans";
import type {
  BillingEntitlements,
  BillingPeriod,
  BillingPlan,
  PlanId,
} from "@/lib/billing/types";

const planEntitlements: Record<PlanId, BillingEntitlements> = {
  free: {
    aiDailyLimit: 0,
    cadenceLimit: 2,
    exportDailyLimit: 1,
    importMonthlyLimit: 1,
    leadLimit: 100,
    mapSearchDailyLimit: 10,
    routeSearchDailyLimit: 3,
    taskLimit: 100,
  },
  pro: {
    aiDailyLimit: 30,
    cadenceLimit: 20,
    exportDailyLimit: 20,
    importMonthlyLimit: 20,
    leadLimit: 3000,
    mapSearchDailyLimit: 100,
    routeSearchDailyLimit: 30,
    taskLimit: 5000,
  },
  pro_plus: {
    aiDailyLimit: 200,
    cadenceLimit: 100,
    exportDailyLimit: 100,
    importMonthlyLimit: 100,
    leadLimit: 20000,
    mapSearchDailyLimit: 500,
    routeSearchDailyLimit: 100,
    taskLimit: 50000,
  },
};

export const BILLING_PLANS: Record<PlanId, BillingPlan> = {
  free: {
    ...planEntitlements.free,
    billingPeriod: "monthly",
    description: SUBSCRIPTION_PLANS.free_beta.description,
    displayPrice: SUBSCRIPTION_PLANS.free_beta.displayPrice,
    highlighted: false,
    id: "free",
    name: "Free",
    priceMonthly: 0,
  },
  pro: {
    ...planEntitlements.pro,
    billingPeriod: "monthly",
    description: SUBSCRIPTION_PLANS.pro.description,
    displayPrice: SUBSCRIPTION_PLANS.pro.displayPrice,
    highlighted: true,
    id: "pro",
    name: "Pro",
    priceMonthly: SUBSCRIPTION_PLANS.pro.priceVnd,
  },
  pro_plus: {
    ...planEntitlements.pro_plus,
    billingPeriod: "monthly",
    description: SUBSCRIPTION_PLANS.pro_plus.description,
    displayPrice: SUBSCRIPTION_PLANS.pro_plus.displayPrice,
    highlighted: false,
    id: "pro_plus",
    name: "Pro Plus",
    priceMonthly: SUBSCRIPTION_PLANS.pro_plus.priceVnd,
  },
};

export const PAID_BILLING_PLAN_IDS = ["pro", "pro_plus"] as const;

export function normalizePlanId(value?: string | null): PlanId {
  if (value === "pro" || value === "pro_plus") {
    return value;
  }

  return "free";
}

export function toSubscriptionPlanKey(planId?: string | null): SubscriptionPlanKey {
  const normalized = normalizePlanId(planId);

  return normalized === "free" ? "free_beta" : normalized;
}

export function fromSubscriptionPlanKey(planKey?: string | null): PlanId {
  return planKey === "pro" || planKey === "pro_plus" ? planKey : "free";
}

export function getAvailablePlans() {
  return [BILLING_PLANS.free, BILLING_PLANS.pro, BILLING_PLANS.pro_plus];
}

export function getPlanById(planId?: string | null) {
  return BILLING_PLANS[normalizePlanId(planId)];
}

export function getPlanEntitlements(planId?: string | null) {
  const plan = getPlanById(planId);

  return {
    aiDailyLimit: plan.aiDailyLimit,
    cadenceLimit: plan.cadenceLimit,
    exportDailyLimit: plan.exportDailyLimit,
    importMonthlyLimit: plan.importMonthlyLimit,
    leadLimit: plan.leadLimit,
    mapSearchDailyLimit: plan.mapSearchDailyLimit,
    routeSearchDailyLimit: plan.routeSearchDailyLimit,
    taskLimit: plan.taskLimit,
  } satisfies BillingEntitlements;
}

export function getPlanPrice(planId: string, billingPeriod: BillingPeriod) {
  const plan = getPlanById(planId);

  if (billingPeriod === "yearly") {
    return plan.priceMonthly * 12;
  }

  if (billingPeriod === "manual") {
    return plan.priceMonthly;
  }

  return plan.priceMonthly;
}

export function isPaidPlan(planId?: string | null) {
  return normalizePlanId(planId) !== "free";
}
