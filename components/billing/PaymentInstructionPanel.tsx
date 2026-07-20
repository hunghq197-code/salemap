"use client";

import { CheckCircle2, Copy, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  trackPaymentInstructionViewed,
  trackPaymentMarkedTransferred,
} from "@/lib/analytics/client";
import type { PaymentRequestRecord } from "@/lib/data/payment-requests";

type PaymentInstructionPanelProps = {
  bank: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    transferContent: string;
  };
  paymentRequest: PaymentRequestRecord;
};

type UpdateResponse = {
  error?: {
    message?: string;
  };
  success?: boolean;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    cancelled: "Đã hủy",
    expired: "Đã hết hạn",
    paid: "Đã thanh toán",
    pending: "Chờ chuyển khoản",
    rejected: "Bị từ chối",
    waiting_confirmation: "Chờ xác nhận",
  };

  return labels[status] || status;
}

function requestTypeLabel(value?: string | null) {
  const labels: Record<string, string> = {
    new_subscription: "Nâng cấp mới",
    plan_change: "Đổi gói",
    renewal: "Gia hạn",
  };

  return labels[value || "new_subscription"] || "Nâng cấp mới";
}

export function PaymentInstructionPanel({
  bank,
  paymentRequest,
}: PaymentInstructionPanelProps) {
  const router = useRouter();
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canUpdate =
    paymentRequest.status === "pending" ||
    paymentRequest.status === "waiting_confirmation";

  useEffect(() => {
    trackPaymentInstructionViewed({
      amountVnd: paymentRequest.amount_vnd,
      planKey: paymentRequest.plan_key,
      requestType: paymentRequest.request_type || "new_subscription",
      status: paymentRequest.status,
    });
  }, [
    paymentRequest.amount_vnd,
    paymentRequest.plan_key,
    paymentRequest.request_type,
    paymentRequest.status,
  ]);

  async function copyText(value: string, key: string) {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(""), 1600);
  }

  async function handleSubmit(formData: FormData) {
    if (isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/payment-requests/${paymentRequest.id}`, {
        body: JSON.stringify({
          status: "waiting_confirmation",
          transactionReference: String(formData.get("transactionReference") || ""),
          userNote: String(formData.get("userNote") || ""),
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const result = (await response.json()) as UpdateResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "Không thể cập nhật thanh toán.");
      }

      trackPaymentMarkedTransferred({
        planKey: paymentRequest.plan_key,
        status: "waiting_confirmation",
      });
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Không thể cập nhật thanh toán lúc này.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-ink">Thông tin chuyển khoản</h2>
        <div className="mt-5 space-y-3">
          {[
            ["Số tiền cần chuyển", formatCurrency(paymentRequest.amount_vnd), "amount"],
            ["Loại yêu cầu", requestTypeLabel(paymentRequest.request_type), "requestType"],
            ["Số tháng", `${paymentRequest.months ?? 1} tháng`, "months"],
            ["Ngân hàng", bank.bankName, "bank"],
            ["Số tài khoản", bank.accountNumber, "account"],
            ["Chủ tài khoản", bank.accountName, "accountName"],
          ].map(([label, value, key]) => (
            <div
              className="flex flex-col gap-2 rounded-lg bg-cloud px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              key={key}
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  {label}
                </p>
                <p className="mt-1 font-bold text-ink">{value}</p>
              </div>
              {key !== "bank" ? (
                <button
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink hover:border-ocean"
                  onClick={() => copyText(value, key)}
                  type="button"
                >
                  <Copy aria-hidden="true" className="h-4 w-4" />
                  {copied === key ? "Đã copy" : "Copy"}
                </button>
              ) : null}
            </div>
          ))}

          <div className="rounded-lg border border-ocean/20 bg-mint/10 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-ocean">
              Nội dung chuyển khoản
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="break-all font-mono text-xl font-bold text-ink">
                {bank.transferContent}
              </p>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ocean"
                onClick={() => copyText(bank.transferContent, "transferContent")}
                type="button"
              >
                <Copy aria-hidden="true" className="h-4 w-4" />
                {copied === "transferContent"
                  ? "Đã copy"
                  : "Copy nội dung chuyển khoản"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-ink">Xác nhận sau khi chuyển khoản</h2>
        <p className="mt-2 text-base leading-7 text-slate-600">
          Đây là quy trình thủ công. Gói của bạn sẽ được kích hoạt sau khi admin xác nhận thanh toán.
        </p>
        <div className="mt-4 rounded-lg bg-cloud px-4 py-3 text-sm font-bold text-ocean">
          Trạng thái: {statusLabel(paymentRequest.status)}
        </div>

        {paymentRequest.status === "waiting_confirmation" ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-700">
            Chúng tôi đã ghi nhận thông tin. Gói của bạn sẽ được kích hoạt sau khi thanh toán được xác nhận.
          </div>
        ) : null}

        {paymentRequest.status === "paid" ? (
          <div className="mt-4 flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-700">
            <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0" />
            Thanh toán đã được xác nhận.
          </div>
        ) : null}

        {canUpdate ? (
          <form action={handleSubmit} className="mt-5 space-y-4">
            <label className="block text-sm font-bold text-ink">
              Mã giao dịch / lời nhắn chuyển khoản
              <input
                className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
                defaultValue={paymentRequest.transaction_reference || ""}
                name="transactionReference"
                placeholder="Ví dụ: MBVCB123456"
              />
            </label>
            <label className="block text-sm font-bold text-ink">
              Ghi chú thêm
              <textarea
                className="mt-2 min-h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
                defaultValue={paymentRequest.user_note || ""}
                name="userNote"
                placeholder="Bạn có thể ghi thêm thời gian chuyển khoản hoặc tên tài khoản chuyển."
              />
            </label>
            {error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </div>
            ) : null}
            <button
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft hover:bg-[#5de0b3] disabled:opacity-70"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : null}
              Tôi đã chuyển khoản
            </button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
