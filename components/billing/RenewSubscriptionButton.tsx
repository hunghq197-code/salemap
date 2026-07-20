"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  trackPayOSCheckoutRedirected,
  trackPayOSPaymentLinkCreated,
  trackPayOSPaymentLinkCreateFailed,
  trackRenewalPaymentRequestCreated,
} from "@/lib/analytics/client";
import type { PaidSubscriptionPlanKey } from "@/lib/constants/subscription-plans";

type RenewSubscriptionButtonProps = {
  amountVnd: number;
  disabled?: boolean;
  planKey: PaidSubscriptionPlanKey;
};

type PaymentRequestResponse = {
  data?: {
    amountVnd?: number;
    id?: string;
    months?: number;
    planKey?: string;
    requestType?: string;
  };
  error?: {
    message?: string;
  };
  success?: boolean;
};

type PayOSPaymentLinkResponse = {
  data?: {
    checkoutUrl?: string;
  };
  error?: {
    message?: string;
  };
  success?: boolean;
};

export function RenewSubscriptionButton({
  amountVnd,
  disabled,
  planKey,
}: RenewSubscriptionButtonProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submittingMode, setSubmittingMode] = useState<"manual" | "payos" | null>(null);

  async function handlePayOSRenew() {
    if (submittingMode || disabled) {
      return;
    }

    setError("");
    setSubmittingMode("payos");

    try {
      const response = await fetch("/api/payments/payos/create-link", {
        body: JSON.stringify({
          months: 1,
          planKey,
          requestType: "renewal",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = (await response.json()) as PayOSPaymentLinkResponse;

      if (!response.ok || !result.success || !result.data?.checkoutUrl) {
        throw new Error(result.error?.message || "Không thể tạo link gia hạn.");
      }

      trackPayOSPaymentLinkCreated({
        amountVnd,
        planKey,
        provider: "payos",
        requestType: "renewal",
        status: "pending",
      });
      trackPayOSCheckoutRedirected({
        amountVnd,
        planKey,
        provider: "payos",
        requestType: "renewal",
        status: "pending",
      });
      window.location.assign(result.data.checkoutUrl);
    } catch (renewError) {
      trackPayOSPaymentLinkCreateFailed({
        amountVnd,
        planKey,
        provider: "payos",
        requestType: "renewal",
        status: "failed",
      });
      setError(
        renewError instanceof Error
          ? renewError.message
          : "Không thể tạo link gia hạn lúc này.",
      );
      setSubmittingMode(null);
    }
  }

  async function handleManualRenew() {
    if (submittingMode || disabled) {
      return;
    }

    setError("");
    setSubmittingMode("manual");

    try {
      const response = await fetch("/api/payment-requests", {
        body: JSON.stringify({
          months: 1,
          planKey,
          requestType: "renewal",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = (await response.json()) as PaymentRequestResponse;

      if (!response.ok || !result.success || !result.data?.id) {
        throw new Error(result.error?.message || "Không thể tạo yêu cầu gia hạn.");
      }

      trackRenewalPaymentRequestCreated({
        amountVnd: result.data.amountVnd ?? amountVnd,
        months: result.data.months ?? 1,
        planKey: result.data.planKey ?? planKey,
        requestType: "renewal",
        sourcePage: "billing",
      });
      router.push(`/app/billing/payment/${result.data.id}`);
    } catch (renewError) {
      setError(
        renewError instanceof Error
          ? renewError.message
          : "Không thể tạo yêu cầu gia hạn lúc này.",
      );
      setSubmittingMode(null);
    }
  }

  return (
    <div className="space-y-2">
      <button
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-base font-bold text-white shadow-sm hover:bg-ocean disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        disabled={disabled || Boolean(submittingMode)}
        onClick={handlePayOSRenew}
        type="button"
      >
        {submittingMode === "payos" ? (
          <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
        ) : (
          <RefreshCw aria-hidden="true" className="h-5 w-5" />
        )}
        {submittingMode === "payos"
          ? "Đang tạo link thanh toán..."
          : "Gia hạn bằng payOS"}
      </button>
      <button
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-ink hover:border-ocean disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        disabled={disabled || Boolean(submittingMode)}
        onClick={handleManualRenew}
        type="button"
      >
        {submittingMode === "manual" ? (
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : null}
        {submittingMode === "manual"
          ? "Đang tạo yêu cầu..."
          : "Gia hạn bằng chuyển khoản thủ công"}
      </button>
      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
