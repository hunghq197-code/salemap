"use client";

import { Check, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  trackBillingPageViewed,
  trackPaymentRequestCreated,
  trackPayOSCheckoutRedirected,
  trackPayOSPaymentLinkCreated,
  trackPayOSPaymentLinkCreateFailed,
} from "@/lib/analytics/client";
import {
  isPaidSubscriptionPlanKey,
  SUBSCRIPTION_PLANS,
  type PaidSubscriptionPlanKey,
  type SubscriptionPlanKey,
} from "@/lib/constants/subscription-plans";

type BillingPlansProps = {
  currentPlanKey?: SubscriptionPlanKey;
};

type PaymentRequestResponse = {
  data?: {
    amountVnd?: number;
    id?: string;
    planKey?: string;
  };
  error?: {
    message?: string;
  };
  success?: boolean;
};

type PayOSPaymentLinkResponse = {
  data?: {
    checkoutUrl?: string;
    orderCode?: number;
    paymentRequestId?: string;
    transactionId?: string;
  };
  error?: {
    message?: string;
  };
  success?: boolean;
};

const plans = [
  SUBSCRIPTION_PLANS.free_beta,
  SUBSCRIPTION_PLANS.pro,
  SUBSCRIPTION_PLANS.pro_plus,
];

function planClasses(planKey: string) {
  const highlighted = planKey === "pro";

  return [
    "flex h-full flex-col rounded-lg border bg-white p-5 shadow-sm",
    highlighted ? "border-ocean shadow-soft" : "border-slate-200",
  ].join(" ");
}

function getCta(planKey: string, currentPlanKey?: string) {
  if (planKey === currentPlanKey) {
    return "Đang sử dụng";
  }

  if (planKey === "free_beta") {
    return "Gói miễn phí";
  }

  return planKey === "pro" ? "Thanh toán Pro" : "Thanh toán Pro Plus";
}

function getRequestType(
  planKey: PaidSubscriptionPlanKey,
  currentPlanKey?: SubscriptionPlanKey,
) {
  if (
    currentPlanKey &&
    isPaidSubscriptionPlanKey(currentPlanKey) &&
    currentPlanKey !== planKey
  ) {
    return "plan_change" as const;
  }

  return "new_subscription" as const;
}

export function BillingPlans({ currentPlanKey = "free_beta" }: BillingPlansProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [manualSubmittingPlan, setManualSubmittingPlan] = useState<string | null>(null);
  const [submittingPlan, setSubmittingPlan] = useState<string | null>(null);

  useEffect(() => {
    trackBillingPageViewed();
  }, []);

  async function handlePayOSUpgrade(planKey: PaidSubscriptionPlanKey) {
    if (submittingPlan || manualSubmittingPlan) {
      return;
    }

    const plan = SUBSCRIPTION_PLANS[planKey];
    const requestType = getRequestType(planKey, currentPlanKey);
    setError("");
    setSubmittingPlan(planKey);

    try {
      const response = await fetch("/api/payments/payos/create-link", {
        body: JSON.stringify({ months: 1, planKey, requestType }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = (await response.json()) as PayOSPaymentLinkResponse;

      if (!response.ok || !result.success || !result.data?.checkoutUrl) {
        throw new Error(result.error?.message || "Không thể tạo link thanh toán.");
      }

      trackPayOSPaymentLinkCreated({
        amountVnd: plan.priceVnd,
        planKey,
        provider: "payos",
        requestType,
        status: "pending",
      });
      trackPayOSCheckoutRedirected({
        amountVnd: plan.priceVnd,
        planKey,
        provider: "payos",
        requestType,
        status: "pending",
      });
      window.location.assign(result.data.checkoutUrl);
    } catch (upgradeError) {
      trackPayOSPaymentLinkCreateFailed({
        amountVnd: plan.priceVnd,
        planKey,
        provider: "payos",
        requestType,
        status: "failed",
      });
      setError(
        upgradeError instanceof Error
          ? upgradeError.message
          : "Không thể tạo link thanh toán lúc này.",
      );
      setSubmittingPlan(null);
    }
  }

  async function handleManualUpgrade(planKey: PaidSubscriptionPlanKey) {
    if (submittingPlan || manualSubmittingPlan) {
      return;
    }

    const requestType = getRequestType(planKey, currentPlanKey);
    setError("");
    setManualSubmittingPlan(planKey);

    try {
      const response = await fetch("/api/payment-requests", {
        body: JSON.stringify({ planKey, requestType }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = (await response.json()) as PaymentRequestResponse;

      if (!response.ok || !result.success || !result.data?.id) {
        throw new Error(result.error?.message || "Không thể tạo yêu cầu chuyển khoản.");
      }

      trackPaymentRequestCreated({
        amountVnd: result.data.amountVnd,
        planKey: result.data.planKey,
        sourcePage: "billing",
      });
      router.push(`/app/billing/payment/${result.data.id}`);
    } catch (upgradeError) {
      setError(
        upgradeError instanceof Error
          ? upgradeError.message
          : "Không thể tạo yêu cầu chuyển khoản lúc này.",
      );
      setManualSubmittingPlan(null);
    }
  }

  return (
    <>
      {error ? (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold leading-6 text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrentPlan = plan.key === currentPlanKey;
          const isFree = plan.key === "free_beta";
          const isSubmitting = submittingPlan === plan.key;
          const isManualSubmitting = manualSubmittingPlan === plan.key;
          const disabled = isCurrentPlan || isFree || Boolean(submittingPlan || manualSubmittingPlan);

          return (
            <article className={planClasses(plan.key)} key={plan.key}>
              <div className="min-h-[142px]">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <h2 className="text-2xl font-bold text-ink">{plan.name}</h2>
                  {plan.highlighted ? (
                    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-mint/20 px-3 py-1 text-xs font-bold leading-5 text-ocean">
                      <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
                      Phù hợp nhất cho sale cá nhân
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 flex items-end gap-1">
                  <p className="text-3xl font-bold text-ink">{plan.displayPrice}</p>
                  <p className="pb-1 text-sm font-semibold text-slate-500">/tháng</p>
                </div>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  {plan.description}
                </p>
              </div>

              <ul className="mt-5 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    className="flex gap-3 text-sm font-semibold leading-6 text-slate-700"
                    key={feature}
                  >
                    <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-ocean" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={[
                  "mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-base font-bold transition",
                  disabled
                    ? "cursor-default border border-slate-200 bg-cloud text-slate-500"
                    : plan.highlighted
                      ? "bg-mint text-ink shadow-soft hover:bg-[#5de0b3]"
                      : "border border-slate-200 bg-white text-ink hover:border-ocean",
                ].join(" ")}
                disabled={disabled}
                onClick={() => handlePayOSUpgrade(plan.key as PaidSubscriptionPlanKey)}
                type="button"
              >
                {isSubmitting ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : null}
                {isSubmitting ? "Đang tạo link thanh toán..." : getCta(plan.key, currentPlanKey)}
              </button>

              {!isFree && !isCurrentPlan ? (
                <button
                  className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-ocean disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={Boolean(submittingPlan || manualSubmittingPlan)}
                  onClick={() => handleManualUpgrade(plan.key as PaidSubscriptionPlanKey)}
                  type="button"
                >
                  {isManualSubmitting ? (
                    <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                  ) : null}
                  {isManualSubmitting
                    ? "Đang tạo yêu cầu..."
                    : "Không thanh toán được? Chuyển khoản thủ công"}
                </button>
              ) : null}
            </article>
          );
        })}
      </div>
    </>
  );
}
