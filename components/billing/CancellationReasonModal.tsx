"use client";

import { Loader2, MessageSquareText, X } from "lucide-react";
import { useState } from "react";
import {
  trackCancellationReasonSubmitted,
  trackSubscriptionCancelRequested,
} from "@/lib/analytics/client";
import {
  CANCELLATION_REASON_OPTIONS,
  type CancellationReasonType,
} from "@/lib/constants/subscription-lifecycle";

type CancellationReasonModalProps = {
  daysRemaining?: number | null;
  planKey: string;
};

type CancellationResponse = {
  error?: {
    message?: string;
  };
  success?: boolean;
};

export function CancellationReasonModal({
  daysRemaining,
  planKey,
}: CancellationReasonModalProps) {
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(formData: FormData) {
    if (isSubmitting) {
      return;
    }

    const reasonType = String(formData.get("reasonType") || "") as CancellationReasonType;
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/cancellation-requests", {
        body: JSON.stringify({
          reasonDetail: String(formData.get("reasonDetail") || ""),
          reasonType,
          wouldReturnIf: String(formData.get("wouldReturnIf") || ""),
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = (await response.json()) as CancellationResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "Không thể gửi phản hồi.");
      }

      trackSubscriptionCancelRequested({
        daysRemaining: daysRemaining ?? undefined,
        planKey,
        reasonType,
        status: "new",
      });
      trackCancellationReasonSubmitted({
        planKey,
        reasonType,
        status: "new",
      });
      setSuccess(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Không thể gửi phản hồi lúc này.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink hover:border-ocean"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <MessageSquareText aria-hidden="true" className="h-4 w-4" />
        Gửi lý do không gia hạn
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/40 px-4 py-6 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-ink">
                  Không muốn tiếp tục sử dụng?
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Chia sẻ lý do để SaleMap cải thiện. Gói hiện tại vẫn có hiệu lực đến hết kỳ.
                </p>
              </div>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-ink"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X aria-hidden="true" className="h-5 w-5" />
                <span className="sr-only">Đóng</span>
              </button>
            </div>

            {success ? (
              <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-700">
                Cảm ơn bạn đã chia sẻ. Gói hiện tại của bạn vẫn có hiệu lực đến hết kỳ.
              </div>
            ) : (
              <form action={handleSubmit} className="mt-5 space-y-4">
                <label className="block text-sm font-bold text-ink">
                  Lý do chính
                  <select
                    className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
                    name="reasonType"
                    required
                  >
                    {CANCELLATION_REASON_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-bold text-ink">
                  Mô tả thêm
                  <textarea
                    className="mt-2 min-h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
                    name="reasonDetail"
                    placeholder="Điều gì làm bạn chưa muốn gia hạn?"
                  />
                </label>

                <label className="block text-sm font-bold text-ink">
                  Điều gì có thể khiến bạn quay lại?
                  <textarea
                    className="mt-2 min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
                    name="wouldReturnIf"
                    placeholder="Ví dụ: dữ liệu tốt hơn, thêm tính năng, giá phù hợp hơn..."
                  />
                </label>

                {error ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    {error}
                  </div>
                ) : null}

                <button
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-base font-bold text-white hover:bg-ocean disabled:opacity-70"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? (
                    <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
                  ) : null}
                  Gửi phản hồi
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
