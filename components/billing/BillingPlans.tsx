"use client";

import { Check, Landmark, Loader2, QrCode, Sparkles, WalletCards } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  trackBillingPageViewed,
  trackPaymentRequestCreated,
  trackPayOSCheckoutRedirected,
  trackPayOSPaymentLinkCreated,
  trackPayOSPaymentLinkCreateFailed,
} from "@/lib/analytics/client";
import {
  BILLING_PLANS,
  fromSubscriptionPlanKey,
} from "@/lib/billing/plans";
import type { PaymentProviderId, PlanId, SafeBillingPayment } from "@/lib/billing/types";
import type { SubscriptionPlanKey } from "@/lib/constants/subscription-plans";

export type BillingProviderOption = {
  configured: boolean;
  enabled: boolean;
  id: PaymentProviderId;
};

type BillingPlansProps = {
  currentPlanKey?: SubscriptionPlanKey;
  providers?: BillingProviderOption[];
};

type CreatePaymentResponse = {
  data?: {
    payment?: SafeBillingPayment;
  };
  error?: {
    message?: string;
  };
  success?: boolean;
};

const plans = [BILLING_PLANS.free, BILLING_PLANS.pro, BILLING_PLANS.pro_plus];

const providerLabels: Record<PaymentProviderId, { description: string; label: string }> = {
  manual_bank_transfer: {
    description: "Tạo lệnh chuyển khoản để admin đối soát và kích hoạt gói.",
    label: "Chuyển khoản",
  },
  payos: {
    description: "Tạo checkout tự động. Gói chỉ active khi webhook hợp lệ.",
    label: "payOS",
  },
  vietqr_manual: {
    description: "Quét VietQR hoặc chuyển khoản, admin xác nhận sau đối soát.",
    label: "VietQR thủ công",
  },
};

function planClasses(planId: string) {
  const highlighted = planId === "pro";

  return [
    "flex h-full flex-col rounded-lg border bg-white p-5 shadow-sm",
    highlighted ? "border-ocean shadow-soft" : "border-slate-200",
  ].join(" ");
}

function getCta(planId: string, currentPlanId?: string) {
  if (planId === currentPlanId) {
    return "Đang sử dụng";
  }

  if (planId === "free") {
    return "Gói miễn phí";
  }

  return planId === "pro" ? "Chọn Pro" : "Chọn Pro Plus";
}

function providerIcon(provider: PaymentProviderId) {
  if (provider === "payos") {
    return WalletCards;
  }

  if (provider === "vietqr_manual") {
    return QrCode;
  }

  return Landmark;
}

export function BillingPlans({
  currentPlanKey = "free_beta",
  providers = [],
}: BillingPlansProps) {
  const router = useRouter();
  const currentPlanId = fromSubscriptionPlanKey(currentPlanKey);
  const [error, setError] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId | null>(null);
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const providerOptions = useMemo(() => {
    const defaultProviders: BillingProviderOption[] = [
      { configured: true, enabled: true, id: "manual_bank_transfer" },
      { configured: true, enabled: true, id: "vietqr_manual" },
    ];

    return providers.length > 0 ? providers : defaultProviders;
  }, [providers]);

  useEffect(() => {
    trackBillingPageViewed();
  }, []);

  async function handleCreatePayment(planId: PlanId, provider: PaymentProviderId) {
    if (submittingKey) {
      return;
    }

    const plan = BILLING_PLANS[planId];
    const key = `${planId}:${provider}`;
    setError("");
    setSubmittingKey(key);

    try {
      const response = await fetch("/api/billing/create-payment", {
        body: JSON.stringify({
          billingPeriod: "monthly",
          planId,
          provider,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = (await response.json()) as CreatePaymentResponse;
      const payment = result.data?.payment;

      if (!response.ok || !result.success || !payment) {
        throw new Error(result.error?.message || "Không thể tạo yêu cầu thanh toán.");
      }

      trackPaymentRequestCreated({
        amountVnd: payment.amount,
        planKey: planId,
        sourcePage: "billing",
      });

      if (provider === "payos") {
        trackPayOSPaymentLinkCreated({
          amountVnd: payment.amount,
          planKey: planId,
          provider: "payos",
          requestType: "new_subscription",
          status: payment.status,
        });

        if (payment.checkoutUrl) {
          trackPayOSCheckoutRedirected({
            amountVnd: payment.amount,
            planKey: planId,
            provider: "payos",
            requestType: "new_subscription",
            status: payment.status,
          });
          window.location.assign(payment.checkoutUrl);
          return;
        }
      }

      router.push(`/app/billing/checkout?paymentId=${payment.id}`);
    } catch (paymentError) {
      if (provider === "payos") {
        trackPayOSPaymentLinkCreateFailed({
          amountVnd: plan.priceMonthly,
          planKey: planId,
          provider: "payos",
          requestType: "new_subscription",
          status: "failed",
        });
      }

      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "Không thể tạo yêu cầu thanh toán lúc này.",
      );
      setSubmittingKey(null);
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
          const isCurrentPlan = plan.id === currentPlanId;
          const isFree = plan.id === "free";
          const disabled = isCurrentPlan || isFree || Boolean(submittingKey);

          return (
            <article className={planClasses(plan.id)} key={plan.id}>
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
                {[
                  `${plan.mapSearchDailyLimit} lượt tìm map/ngày`,
                  `${plan.routeSearchDailyLimit} lượt tìm dọc tuyến/ngày`,
                  `${plan.leadLimit.toLocaleString("vi-VN")} lead`,
                  `${plan.importMonthlyLimit} lượt import/tháng`,
                  `${plan.exportDailyLimit} lượt export/ngày`,
                  `${plan.aiDailyLimit} lượt AI/ngày`,
                ].map((feature) => (
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
                onClick={() => setSelectedPlanId(plan.id)}
                type="button"
              >
                {getCta(plan.id, currentPlanId)}
              </button>

              {selectedPlanId === plan.id && !isFree && !isCurrentPlan ? (
                <div className="mt-4 space-y-2">
                  {providerOptions
                    .filter((provider) => provider.enabled)
                    .map((provider) => {
                      const Icon = providerIcon(provider.id);
                      const isSubmitting = submittingKey === `${plan.id}:${provider.id}`;
                      const disabledProvider = !provider.configured || Boolean(submittingKey);

                      return (
                        <button
                          className="flex min-h-14 w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-bold text-ink transition hover:border-ocean disabled:cursor-not-allowed disabled:bg-cloud disabled:text-slate-500"
                          disabled={disabledProvider}
                          key={provider.id}
                          onClick={() => handleCreatePayment(plan.id, provider.id)}
                          type="button"
                        >
                          {isSubmitting ? (
                            <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
                          ) : (
                            <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-ocean" />
                          )}
                          <span>
                            <span className="block">{providerLabels[provider.id].label}</span>
                            <span className="block text-xs font-semibold leading-5 text-slate-500">
                              {provider.configured
                                ? providerLabels[provider.id].description
                                : "Chưa cấu hình chuyển khoản"}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </>
  );
}
