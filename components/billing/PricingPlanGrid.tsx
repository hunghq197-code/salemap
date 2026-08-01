"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PaymentMethodSelector } from "@/components/billing/PaymentMethodSelector";
import type { BillingProviderOption } from "@/components/billing/PaymentMethodSelector";
import { PricingPlanCard } from "@/components/billing/PricingPlanCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  trackBillingPageViewed,
  trackPaymentRequestCreated,
  trackPayOSCheckoutRedirected,
  trackPayOSPaymentLinkCreated,
  trackPayOSPaymentLinkCreateFailed,
} from "@/lib/analytics/client";
import { BILLING_PLANS, fromSubscriptionPlanKey } from "@/lib/billing/plans";
import type { PaymentProviderId, PlanId, SafeBillingPayment } from "@/lib/billing/types";
import type { SubscriptionPlanKey } from "@/lib/constants/subscription-plans";

export type { BillingProviderOption };

type PricingPlanGridProps = {
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

function defaultProvider(providers: BillingProviderOption[]) {
  return providers.find((provider) => provider.enabled && provider.configured)?.id;
}

export function PricingPlanGrid({
  currentPlanKey = "free_beta",
  providers = [],
}: PricingPlanGridProps) {
  const router = useRouter();
  const currentPlanId = fromSubscriptionPlanKey(currentPlanKey);
  const providerOptions = useMemo(
    () =>
      providers.length > 0
        ? providers
        : [
            { configured: true, enabled: true, id: "manual_bank_transfer" as const },
            { configured: true, enabled: true, id: "vietqr_manual" as const },
          ],
    [providers],
  );
  const [error, setError] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProviderId | undefined>(
    defaultProvider(providerOptions),
  );
  const [submitting, setSubmitting] = useState(false);
  const selectedPlan = selectedPlanId ? BILLING_PLANS[selectedPlanId] : null;

  useEffect(() => {
    trackBillingPageViewed();
  }, []);

  async function createPayment() {
    if (!selectedPlan || !selectedProvider || submitting) {
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/billing/create-payment", {
        body: JSON.stringify({
          billingPeriod: "monthly",
          planId: selectedPlan.id,
          provider: selectedProvider,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = (await response.json()) as CreatePaymentResponse;
      const payment = result.data?.payment;

      if (!response.ok || !result.success || !payment) {
        throw new Error(result.error?.message || "Không thể tạo payment.");
      }

      trackPaymentRequestCreated({
        amountVnd: payment.amount,
        planKey: selectedPlan.id,
        sourcePage: "billing",
      });

      if (selectedProvider === "payos") {
        trackPayOSPaymentLinkCreated({
          amountVnd: payment.amount,
          planKey: selectedPlan.id,
          provider: "payos",
          requestType: "new_subscription",
          status: payment.status,
        });

        if (payment.checkoutUrl) {
          trackPayOSCheckoutRedirected({
            amountVnd: payment.amount,
            planKey: selectedPlan.id,
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
      if (selectedProvider === "payos" && selectedPlan) {
        trackPayOSPaymentLinkCreateFailed({
          amountVnd: selectedPlan.priceMonthly,
          planKey: selectedPlan.id,
          provider: "payos",
          requestType: "new_subscription",
          status: "failed",
        });
      }

      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "Không thể tạo payment lúc này.",
      );
      setSubmitting(false);
    }
  }

  return (
    <section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold text-text-primary">Chọn gói phù hợp</h2>
            <Badge tone="neutral">Monthly</Badge>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
            Nâng cấp khi cần thêm lượt tìm kiếm, import/export, cadence và AI trong tháng.
          </p>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-control border border-danger/20 bg-danger-soft px-4 py-3 text-sm font-semibold leading-6 text-danger">
          {error}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <PricingPlanCard
            currentPlanId={currentPlanId}
            disabled={submitting}
            isSelected={selectedPlanId === plan.id}
            key={plan.id}
            onSelect={setSelectedPlanId}
            plan={plan}
          />
        ))}
      </div>

      {selectedPlan && selectedPlan.id !== "free" ? (
        <div className="mt-5 rounded-card border border-border-soft bg-surface p-4 shadow-card sm:p-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_0.72fr] lg:items-start">
            <PaymentMethodSelector
              disabled={submitting}
              onChange={setSelectedProvider}
              providers={providerOptions}
              value={selectedProvider}
            />
            <div className="rounded-control border border-border-soft bg-surface-muted px-4 py-3">
              <p className="text-sm font-bold text-text-primary">Tóm tắt checkout</p>
              <dl className="mt-3 space-y-2 text-sm leading-6 text-text-secondary">
                <div className="flex items-center justify-between gap-3">
                  <dt>Gói</dt>
                  <dd className="font-bold text-text-primary">{selectedPlan.name}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Kỳ</dt>
                  <dd className="font-bold text-text-primary">1 tháng</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Số tiền</dt>
                  <dd className="font-bold text-text-primary">{selectedPlan.displayPrice}</dd>
                </div>
              </dl>
              <Button
                className="mt-4 w-full"
                disabled={!selectedProvider}
                icon={submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
                loading={submitting}
                loadingLabel="Đang tạo payment..."
                onClick={createPayment}
                variant="primary"
              >
                {selectedProvider === "payos"
                  ? "Tiếp tục thanh toán"
                  : "Tạo hướng dẫn chuyển khoản"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
