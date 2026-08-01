import { ExternalLink } from "lucide-react";
import { PaymentStatusBadge } from "@/components/billing/PaymentStatusBadge";
import { Button } from "@/components/ui/Button";
import type { SafeBillingPayment } from "@/lib/billing/types";

type PaymentHistoryItemProps = {
  payment: SafeBillingPayment;
};

function formatDate(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "Chưa có";
}

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

function providerLabel(provider: string) {
  const labels: Record<string, string> = {
    manual_bank_transfer: "Chuyển khoản",
    payos: "payOS",
    vietqr_manual: "VietQR",
  };

  return labels[provider] || provider;
}

function planLabel(planId: string) {
  return planId === "pro_plus" ? "Pro Plus" : planId === "pro" ? "Pro" : "Free";
}

export function PaymentHistoryItem({ payment }: PaymentHistoryItemProps) {
  return (
    <article className="rounded-control border border-border-soft bg-surface px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-text-primary">{planLabel(payment.planId)}</h3>
            <PaymentStatusBadge status={payment.status} />
            <span className="rounded-full border border-border-soft bg-surface-muted px-3 py-1 text-xs font-bold text-text-secondary">
              {providerLabel(payment.provider)}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-text-secondary">
            {formatDate(payment.createdAt)} · {formatCurrency(payment.amount)}
          </p>
          <p className="mt-1 break-all font-mono text-xs font-bold text-text-primary">
            {payment.paymentCode || payment.orderCode}
          </p>
        </div>
        <Button
          href={`/app/billing/checkout?paymentId=${payment.id}`}
          icon={<ExternalLink className="h-4 w-4" />}
          size="sm"
          variant="outline"
        >
          Xem
        </Button>
      </div>
    </article>
  );
}
