"use client";

import { CheckCircle2, Copy, ExternalLink, ShieldCheck, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ManualTransferInstructions } from "@/components/billing/ManualTransferInstructions";
import { PaymentStatusBadge } from "@/components/billing/PaymentStatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { SafeBillingPayment } from "@/lib/billing/types";
import { getPaymentStatusPresentation } from "@/lib/design-system/status";

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
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

function providerLabel(provider: string) {
  const labels: Record<string, string> = {
    manual_bank_transfer: "Chuyển khoản ngân hàng",
    payos: "payOS",
    vietqr_manual: "VietQR thủ công",
  };

  return labels[provider] || provider;
}

function planLabel(planId: string) {
  return planId === "pro_plus" ? "Pro Plus" : planId === "pro" ? "Pro" : "Free";
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
  const canCancel = ["pending", "processing", "waiting_confirmation"].includes(payment.status);
  const statusPresentation = getPaymentStatusPresentation(payment.status);
  const StatusIcon = statusPresentation.icon;

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
        throw new Error(result.error?.message || "Không thể cập nhật payment.");
      }

      router.refresh();
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : "Không thể cập nhật payment lúc này.",
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
        throw new Error(result.error?.message || "Không thể hủy payment.");
      }

      router.refresh();
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : "Không thể hủy payment lúc này.",
      );
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div className="mt-8 space-y-5">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
              <StatusIcon aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-text-primary">Payment order</h2>
                <PaymentStatusBadge status={payment.status} />
                <Badge tone="neutral">{providerLabel(payment.provider)}</Badge>
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
                {statusPresentation.description}
              </p>
            </div>
          </div>

          {payment.provider === "payos" && payment.checkoutUrl && payment.status === "pending" ? (
            <Button
              href={payment.checkoutUrl}
              icon={<ExternalLink className="h-4 w-4" />}
              size="lg"
              variant="primary"
            >
              Đi tới trang thanh toán
            </Button>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Gói", planLabel(payment.planId), "plan"],
            ["Số tiền", formatCurrency(payment.amount), "amount"],
            ["Mã thanh toán", payment.paymentCode || String(payment.orderCode), "code"],
            ["Order code", String(payment.orderCode), "order"],
          ].map(([label, value, key]) => (
            <div className="rounded-control border border-border-soft bg-surface-muted px-4 py-3" key={key}>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
                {label}
              </p>
              <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
                <p className="min-w-0 break-words text-sm font-bold text-text-primary">{value}</p>
                {key === "code" || key === "order" ? (
                  <button
                    aria-label={`Copy ${label}`}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-border-soft bg-surface text-text-secondary hover:border-primary/40 hover:text-primary"
                    onClick={() => copyText(value, key)}
                    type="button"
                  >
                    {copied === key ? (
                      <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-success" />
                    ) : (
                      <Copy aria-hidden="true" className="h-4 w-4" />
                    )}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {isManual ? (
        <ManualTransferInstructions
          canConfirm={canConfirm}
          isConfirming={isConfirming}
          onConfirm={confirmTransfer}
          payment={payment}
        />
      ) : (
        <Card>
          <div className="flex gap-3 rounded-control border border-border-soft bg-surface-muted px-4 py-3 text-sm font-semibold leading-6 text-text-secondary">
            <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            payOS chỉ kích hoạt gói sau khi webhook hợp lệ được xác minh. Trang return chỉ
            hiển thị trạng thái hiện tại.
          </div>
        </Card>
      )}

      {payment.status === "paid" ? (
        <div className="flex gap-3 rounded-card border border-success/20 bg-success-soft px-4 py-3 text-sm font-semibold leading-6 text-emerald-700">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          Payment đã paid. Nếu quota chưa cập nhật, hãy reload lại app sau vài giây.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-card border border-danger/20 bg-danger-soft px-4 py-3 text-sm font-semibold leading-6 text-danger">
          {error}
        </div>
      ) : null}

      {canCancel ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold leading-6 text-text-secondary">
            Hủy payment không tạo payment mới và không thay đổi subscription.
          </p>
          <Button
            icon={<XCircle className="h-4 w-4" />}
            loading={isCancelling}
            loadingLabel="Đang hủy..."
            onClick={cancelPayment}
            variant="outline"
          >
            Hủy payment này
          </Button>
        </div>
      ) : null}
    </div>
  );
}
