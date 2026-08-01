"use client";

/* eslint-disable @next/next/no-img-element */

import { AlertTriangle, CheckCircle2, Copy, Loader2, QrCode } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { SafeBillingPayment } from "@/lib/billing/types";

type ManualTransferInstructionsProps = {
  canConfirm?: boolean;
  isConfirming?: boolean;
  onConfirm?: () => void;
  payment: SafeBillingPayment;
};

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

export function ManualTransferInstructions({
  canConfirm = false,
  isConfirming = false,
  onConfirm,
  payment,
}: ManualTransferInstructionsProps) {
  const [copied, setCopied] = useState("");

  async function copyText(value: string, key: string) {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(""), 1400);
  }

  const transferContent = payment.transferContent || payment.paymentCode || String(payment.orderCode);
  const rows = [
    ["Ngân hàng", payment.bankInfo?.bankName || "Chưa cấu hình", "bank"],
    ["Số tài khoản", payment.bankInfo?.accountNumber || "Chưa cấu hình", "account"],
    ["Chủ tài khoản", payment.bankInfo?.accountName || "Chưa cấu hình", "name"],
    ["Số tiền", formatCurrency(payment.amount), "amount"],
    ["Nội dung", transferContent, "transfer"],
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.72fr]">
      <section className="rounded-card border border-border-soft bg-surface p-4 shadow-card sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-accent-soft text-cyan-700">
            <QrCode aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-text-primary">Hướng dẫn chuyển khoản</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Chuyển đúng số tiền và nội dung để admin đối soát nhanh hơn.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {rows.map(([label, value, key]) => (
            <div
              className="flex flex-col gap-3 rounded-control border border-border-soft bg-surface-muted px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              key={key}
            >
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
                  {label}
                </p>
                <p
                  className={[
                    "mt-1 break-words font-bold text-text-primary",
                    key === "transfer" ? "font-mono text-base sm:text-lg" : "text-sm",
                  ].join(" ")}
                >
                  {value}
                </p>
              </div>
              {key !== "bank" ? (
                <Button
                  className="shrink-0"
                  icon={<Copy className="h-4 w-4" />}
                  onClick={() => copyText(value, key)}
                  size="sm"
                  variant="outline"
                >
                  {copied === key ? "Đã copy" : "Copy"}
                </Button>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-5 flex gap-3 rounded-control border border-warning/25 bg-warning-soft px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          Sai số tiền hoặc thiếu nội dung chuyển khoản có thể khiến payment bị treo đối soát.
        </div>
      </section>

      <section className="rounded-card border border-border-soft bg-surface p-4 shadow-card sm:p-5">
        {payment.qrCode ? (
          <div>
            <h2 className="text-xl font-bold text-text-primary">Mã QR thanh toán</h2>
            <div className="mt-4 rounded-control border border-border-soft bg-white p-3">
              <img
                alt={`VietQR thanh toán SaleMap order ${payment.orderCode}`}
                className="mx-auto h-auto w-full max-w-[320px]"
                src={payment.qrCode}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-control border border-border-soft bg-surface-muted px-4 py-3 text-sm font-semibold leading-6 text-text-secondary">
            Chưa có QR khả dụng. Bạn vẫn có thể chuyển khoản theo thông tin bên cạnh.
          </div>
        )}

        {payment.status === "waiting_confirmation" ? (
          <div className="mt-5 flex gap-3 rounded-control border border-warning/25 bg-warning-soft px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
            <Loader2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            Đang chờ admin xác nhận. Gói chưa được kích hoạt ở trạng thái này.
          </div>
        ) : null}

        {payment.status === "paid" ? (
          <div className="mt-5 flex gap-3 rounded-control border border-success/20 bg-success-soft px-4 py-3 text-sm font-semibold leading-6 text-emerald-700">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            Payment đã paid và subscription đã được xử lý server-side.
          </div>
        ) : null}

        {canConfirm ? (
          <Button
            className="mt-5 w-full"
            loading={isConfirming}
            loadingLabel="Đang ghi nhận..."
            onClick={onConfirm}
            size="lg"
            variant="primary"
          >
            Tôi đã chuyển khoản
          </Button>
        ) : null}
      </section>
    </div>
  );
}
