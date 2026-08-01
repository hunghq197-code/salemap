import { CalendarClock, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { PaymentStatusBadge } from "@/components/billing/PaymentStatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getPlanById } from "@/lib/billing/plans";
import type { PlanId } from "@/lib/billing/types";
import { getSubscriptionStatusPresentation } from "@/lib/design-system/status";

type CurrentPlanCardProps = {
  actions?: ReactNode;
  currentPeriodEnd?: string | null;
  currentPeriodStart?: string | null;
  daysRemaining?: number | null;
  planId: PlanId | string;
  planName?: string | null;
  schemaReady?: boolean;
  status?: string | null;
};

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("vi-VN") : "Chưa có";
}

function periodText(daysRemaining?: number | null) {
  if (daysRemaining === null || daysRemaining === undefined) {
    return "Chưa có ngày hết hạn";
  }

  if (daysRemaining <= 0) {
    return "Đã hết hạn";
  }

  return `Còn ${daysRemaining} ngày`;
}

export function CurrentPlanCard({
  actions,
  currentPeriodEnd,
  currentPeriodStart,
  daysRemaining,
  planId,
  planName,
  schemaReady = true,
  status,
}: CurrentPlanCardProps) {
  const plan = getPlanById(planId);
  const presentation = getSubscriptionStatusPresentation(status);
  const Icon = presentation.icon;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-control bg-primary-soft text-primary">
              <ShieldCheck aria-hidden="true" className="h-5 w-5" />
            </span>
            <PaymentStatusBadge kind="subscription" status={status} />
            {!schemaReady ? <Badge tone="warning">Cần chạy SQL</Badge> : null}
          </div>
          <h2 className="mt-4 text-2xl font-bold leading-tight text-text-primary sm:text-3xl">
            {planName || plan.name}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
            {presentation.description}
          </p>
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
            {actions}
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {[
          ["Bắt đầu kỳ", formatDate(currentPeriodStart)],
          ["Kết thúc kỳ", formatDate(currentPeriodEnd)],
          ["Thời hạn", periodText(daysRemaining)],
        ].map(([label, value]) => (
          <div className="rounded-control border border-border-soft bg-surface-muted px-4 py-3" key={label}>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
              {label}
            </p>
            <p className="mt-1 break-words text-sm font-bold text-text-primary">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex gap-3 rounded-control border border-border-soft bg-surface-muted px-4 py-3 text-sm font-semibold leading-6 text-text-secondary">
        <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <span>
          SaleMap không tự gia hạn nếu chưa có recurring billing thật. Subscription chỉ đổi sau
          khi server xử lý payment hợp lệ.
        </span>
      </div>

      {status === "grace" ? (
        <div className="mt-4 flex gap-3 rounded-control border border-warning/25 bg-warning-soft px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
          <CalendarClock aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          Gói đang ở grace period. Khi grace hết hạn, entitlement sẽ quay về Free.
        </div>
      ) : null}
    </Card>
  );
}
