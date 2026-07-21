"use client";

import { Loader2, X } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import {
  trackUpgradeInterestFailed,
  trackUpgradeInterestSubmitted,
} from "@/lib/analytics/client";
import type { PricingPlan } from "@/lib/constants/plans";

type UpgradeInterestModalProps = {
  onClose: () => void;
  plan: PricingPlan | null;
};

type UpgradeInterestResponse = {
  error?: {
    code?: string;
    message?: string;
  };
  success?: boolean;
};

const priceOptions = [
  "Dưới 50.000đ/tháng",
  "50.000-99.000đ/tháng",
  "99.000-149.000đ/tháng",
  "149.000-249.000đ/tháng",
  "Trên 249.000đ/tháng",
  "Cần dùng thử thêm trước",
];

const featureOptions = [
  "Tìm khách quanh tôi",
  "Tìm khách theo khu vực",
  "Tìm khách dọc tuyến đường",
  "Lưu lead cá nhân",
  "Ghi chú và follow-up",
  "Xuất dữ liệu",
  "Template sale",
  "Tính năng khác",
];

function getErrorMessage(payload: UpgradeInterestResponse) {
  return (
    payload.error?.message ||
    "Không thể ghi nhận quan tâm nâng cấp lúc này. Vui lòng thử lại."
  );
}

function UpgradeInterestModalContent({
  onClose,
  plan,
}: {
  onClose: () => void;
  plan: PricingPlan;
}) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || !plan) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const reason = String(formData.get("reason") || "").trim();
    const expectedPrice = String(formData.get("expectedPrice") || "").trim();
    const mainFeatureInterest = String(formData.get("mainFeatureInterest") || "").trim();

    try {
      const response = await fetch("/api/upgrade-interest", {
        body: JSON.stringify({
          expectedPrice,
          mainFeatureInterest,
          planKey: plan.key,
          planName: plan.name,
          reason,
          sourcePage: "billing",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = (await response.json()) as UpgradeInterestResponse;

      if (!response.ok || !result.success) {
        trackUpgradeInterestFailed({
          errorCode: result.error?.code || "UPGRADE_INTEREST_FAILED",
          expectedPrice,
          mainFeatureInterest,
          planKey: plan.key,
        });
        setError(getErrorMessage(result));
        return;
      }

      trackUpgradeInterestSubmitted({
        expectedPrice,
        mainFeatureInterest,
        planKey: plan.key,
      });
      setSubmitted(true);
    } catch {
      trackUpgradeInterestFailed({
        errorCode: "NETWORK_ERROR",
        planKey: plan.key,
      });
      setError("Không thể ghi nhận quan tâm nâng cấp lúc này. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/50 px-4 py-4 sm:items-center">
      <section
        aria-modal="true"
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-5 shadow-2xl sm:p-6"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold leading-tight text-ink">
              Bạn quan tâm gói {plan.name}?
            </h2>
            <p className="mt-2 text-base leading-7 text-slate-600">
              Hiện SaleMap chưa mở thanh toán. Thông tin này giúp chúng tôi ưu
              tiên gói phù hợp và liên hệ bạn khi bản Pro sẵn sàng.
            </p>
          </div>
          <button
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-ocean hover:text-ink"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
            <span className="sr-only">Đóng</span>
          </button>
        </div>

        {submitted ? (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-base font-semibold leading-7 text-emerald-800">
            Cảm ơn bạn. Chúng tôi đã ghi nhận quan tâm nâng cấp của bạn.
            <button
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-ocean"
              onClick={onClose}
              type="button"
            >
              Đóng
            </button>
          </div>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm font-bold text-ink">
              Lý do bạn quan tâm gói này?
              <textarea
                className="mt-2 min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-ink outline-none transition placeholder:text-slate-400 focus:border-ocean focus:ring-2 focus:ring-ocean/20"
                maxLength={1000}
                name="reason"
                placeholder="Ví dụ: tôi cần tìm khách nhiều hơn mỗi ngày, cần export nhiều hơn, cần route search thường xuyên..."
              />
            </label>

            <label className="block text-sm font-bold text-ink">
              Mức giá bạn thấy hợp lý?
              <select
                className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-ink outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
                name="expectedPrice"
              >
                <option value="">Chọn mức giá</option>
                {priceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-bold text-ink">
              Tính năng khiến bạn muốn nâng cấp nhất?
              <select
                className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-ink outline-none transition focus:border-ocean focus:ring-2 focus:ring-ocean/20"
                name="mainFeatureInterest"
              >
                <option value="">Chọn tính năng</option>
                {featureOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            {error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold leading-6 text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft transition hover:bg-[#5de0b3] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
              ) : null}
              {isSubmitting ? "Đang gửi..." : "Gửi quan tâm"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

export function UpgradeInterestModal({ onClose, plan }: UpgradeInterestModalProps) {
  if (!plan) {
    return null;
  }

  return <UpgradeInterestModalContent key={plan.key} onClose={onClose} plan={plan} />;
}
