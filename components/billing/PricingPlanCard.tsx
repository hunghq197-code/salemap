"use client";

import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { BillingPlan, PlanId } from "@/lib/billing/types";

type PricingPlanCardProps = {
  currentPlanId?: string;
  disabled?: boolean;
  isSelected?: boolean;
  onSelect: (planId: PlanId) => void;
  plan: BillingPlan;
};

function formatLimit(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function ctaLabel(planId: string, currentPlanId?: string) {
  if (planId === currentPlanId && planId !== "free") return "Gia hạn gói này";
  if (planId === currentPlanId) return "Đang sử dụng";
  if (planId === "free") return "Gói miễn phí";
  return planId === "pro" ? "Chọn Pro" : "Chọn Pro Plus";
}

export function PricingPlanCard({
  currentPlanId,
  disabled = false,
  isSelected = false,
  onSelect,
  plan,
}: PricingPlanCardProps) {
  const isFree = plan.id === "free";
  const canSelect = !disabled && !isFree;

  return (
    <Card
      as="article"
      className={[
        "flex h-full min-h-[520px] flex-col",
        plan.highlighted ? "border-primary/45 shadow-floating" : "",
        isSelected ? "ring-2 ring-primary/25" : "",
      ].join(" ")}
    >
      <div className="min-h-[168px]">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <h3 className="break-words text-2xl font-bold text-text-primary">{plan.name}</h3>
          {plan.highlighted ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-xs font-bold leading-5 text-cyan-700">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              Phổ biến
            </span>
          ) : null}
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold text-text-primary">{plan.displayPrice}</p>
          <p className="mt-1 text-sm font-semibold text-text-secondary">mỗi tháng</p>
        </div>
        <p className="mt-3 text-sm leading-6 text-text-secondary">{plan.description}</p>
      </div>

      <ul className="mt-5 flex-1 space-y-3">
        {[
          `${formatLimit(plan.mapSearchDailyLimit)} lượt tìm map/ngày`,
          `${formatLimit(plan.routeSearchDailyLimit)} lượt tìm dọc tuyến/ngày`,
          `${formatLimit(plan.leadLimit)} lead`,
          `${formatLimit(plan.taskLimit)} task`,
          `${formatLimit(plan.cadenceLimit)} cadence`,
          `${formatLimit(plan.importMonthlyLimit)} lượt import/tháng`,
          `${formatLimit(plan.exportDailyLimit)} lượt export/ngày`,
          `${formatLimit(plan.aiDailyLimit)} lượt AI/ngày`,
        ].map((feature) => (
          <li className="flex gap-3 text-sm font-semibold leading-6 text-text-secondary" key={feature}>
            <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <span className="min-w-0 break-words">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        className="mt-6 w-full"
        disabled={!canSelect}
        onClick={() => onSelect(plan.id)}
        variant={plan.highlighted ? "primary" : "outline"}
      >
        {ctaLabel(plan.id, currentPlanId)}
      </Button>
    </Card>
  );
}
