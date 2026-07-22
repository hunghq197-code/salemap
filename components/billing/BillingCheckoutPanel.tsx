"use client";

/* eslint-disable @next/next/no-img-element */

import { CheckCircle2, Copy, ExternalLink, Loader2, QrCode, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SafeBillingPayment } from "@/lib/billing/types";

type BillingCheckoutPanelProps = {
  payment: SafeBillingPayment;
};

type ApiResponse = {
  data?: {
    payment?: SafeBillingPayment;
  };
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
    failed: "Thất bại",
    paid: "Đã thanh toán",
    pending: "Chờ thanh toán",
    processing: "Đang xử lý",
    refunded: "Đã hoàn tiền",
    waiting_confirmation: "Chờ admin xác nhận",
  };

  return labels[status] || status;
}

function providerLabel(provider: string) {
  const labels: Record<string, string> = {
    manual_bank_transfer: "Chuyển khoản ngân hàng",
    payos: "payOS",
    vietqr_manual: "VietQR thủ công",
  };

  return labels[provider] || provider;
}

export function BillingCheckoutPanel({ payment }: BillingCheckoutPanelProps) {
  const router = useRouter();
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const isManual =
    payment.provider === "manual_bank_transfer" || payment.provider === "vietqr_manual";
  const canConfirm = isManual && payment.status === "pending";
  const canCancel = payment.status === "pending" || payment.status === "processing";

  async function copyText(value: string, key: string) {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(""), 1400);
  }

  async function confirmTransfer() {
    if (isConfirming) return;
    setError("");
    setIsConfirming(true);

    try {
      const response = await fetch(
        `/api/billing/payments/${payment.id}/confirm-transfer`,
        { method: "POST" },
      );
      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "Không thể cập nhật thanh toán.");
      }

      router.refresh();
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : "Không thể cập nhật thanh toán lúc này.",
      );
    } finally {
      setIsConfirming(false);
    }
  }

  async function cancelPayment() {
    if (isCancelling) return;
    setError("");
    setIsCancelling(true);

    try {
      const response = await fetch("/api/billing/cancel-payment", {
        body: JSON.stringify({ paymentId: payment.id }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "Không thể hủy thanh toán.");
      }

      router.refresh();
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : "Không thể hủy thanh toán lúc này.",
      );
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-ocean/10 text-ocean">
            <QrCode aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-ink">Thông tin thanh toán</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Gói chỉ được kích hoạt sau khi hệ thống xác nhận thanh toán hợp lệ.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            ["Phương thức", providerLabel(payment.provider), "provider"],
            ["Số tiền", formatCurrency(payment.amount), "amount"],
            ["Mã thanh toán", payment.paymentCode || String(payment.orderCode), "code"],
            ["Trạng thái", statusLabel(payment.status), "status"],
          ].map(([label, value, key]) => (
            <div className="rounded-lg bg-cloud px-4 py-3" key={key}>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                {label}
              </p>
              <p className="mt-1 break-words font-bold text-ink">{value}</p>
            </div>
          ))}
        </div>

        {isManual ? (
          <div className="mt-5 space-y-3">
            {[
              ["Ngân hàng", payment.bankInfo?.bankName || "Chưa cấu hình", "bank"],
              ["Số tài khoản", payment.bankInfo?.accountNumber || "Chưa cấu hình", "account"],
              ["Chủ tài khoản", payment.bankInfo?.accountName || "Chưa cấu hình", "name"],
            ].map(([label, value, key]) => (
              <div
                className="flex flex-col gap-3 rounded-lg border border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
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
                  {payment.transferContent || payment.paymentCode}
                </p>
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ocean"
                  onClick={() =>
                    copyText(payment.transferContent || payment.paymentCode || "", "transfer")
                  }
                  type="button"
                >
                  <Copy aria-hidden="true" className="h-4 w-4" />
                  {copied === "transfer" ? "Đã copy" : "Copy nội dung"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {payment.provider === "payos" && payment.checkoutUrl ? (
          <a
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft hover:bg-[#5de0b3]"
            href={payment.checkoutUrl}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink aria-hidden="true" className="h-5 w-5" />
            Đi tới trang thanh toán
          </a>
        ) : null}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        {payment.qrCode ? (
          <div>
            <h2 className="text-xl font-bold text-ink">Mã QR thanh toán</h2>
            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
              <img
                alt="VietQR thanh toán SaleMap"
                className="mx-auto h-auto w-full max-w-[320px]"
                src={payment.qrCode}
              />
            </div>
          </div>
        ) : (
          <div className="flex gap-3 rounded-lg bg-cloud px-4 py-3 text-sm font-semibold leading-6 text-slate-600">
            <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-ocean" />
            {isManual
              ? "Nếu chưa có QR, bạn vẫn có thể chuyển khoản theo thông tin bên trái."
              : "Sau khi thanh toán, hệ thống sẽ xác nhận qua webhook payOS."}
          </div>
        )}

        {payment.status === "waiting_confirmation" ? (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
            Chúng tôi đang kiểm tra giao dịch. Gói sẽ được kích hoạt sau khi admin xác nhận.
          </div>
        ) : null}

        {payment.status === "paid" ? (
          <div className="mt-5 flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-700">
            <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0" />
            Thanh toán thành công. Gói của bạn đã được kích hoạt.
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-5 space-y-3">
          {canConfirm ? (
            <button
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft hover:bg-[#5de0b3] disabled:opacity-70"
              disabled={isConfirming}
              onClick={confirmTransfer}
              type="button"
            >
              {isConfirming ? (
                <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
              ) : null}
              Tôi đã chuyển khoản
            </button>
          ) : null}

          {canCancel ? (
            <button
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-rose-300 hover:text-rose-700 disabled:opacity-70"
              disabled={isCancelling}
              onClick={cancelPayment}
              type="button"
            >
              {isCancelling ? "Đang hủy..." : "Hủy thanh toán này"}
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
