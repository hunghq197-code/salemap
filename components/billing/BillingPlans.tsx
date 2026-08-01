"use client";

import {
  PricingPlanGrid,
  type BillingProviderOption,
} from "@/components/billing/PricingPlanGrid";
import type { SubscriptionPlanKey } from "@/lib/constants/subscription-plans";

type BillingPlansProps = {
  currentPlanKey?: SubscriptionPlanKey;
  providers?: BillingProviderOption[];
};

export function BillingPlans(props: BillingPlansProps) {
  return <PricingPlanGrid {...props} />;
}

export type { BillingProviderOption };
