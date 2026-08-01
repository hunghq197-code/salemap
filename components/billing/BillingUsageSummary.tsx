import { Gauge } from "lucide-react";
import { QuotaUsageItem } from "@/components/billing/QuotaUsageItem";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { DailyUsage } from "@/lib/data/usage";

type BillingUsageSummaryProps = {
  items: DailyUsage[];
  planName?: string | null;
  schemaReady?: boolean;
};

export function BillingUsageSummary({
  items,
  planName,
  schemaReady = true,
}: BillingUsageSummaryProps) {
  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-accent-soft text-cyan-700">
            <Gauge aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-text-primary">Usage & quota</h2>
              {planName ? <Badge tone="primary">{planName}</Badge> : null}
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
              Hạn mức được tính server-side theo subscription, quota override và usage trong
              ngày hiện tại.
            </p>
          </div>
        </div>
      </div>

      {!schemaReady ? (
        <p className="mt-4 rounded-control border border-warning/25 bg-warning-soft px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
          Chưa bật bảng quota trong Supabase. Usage dưới đây có thể chưa phản ánh dữ liệu thật.
        </p>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <QuotaUsageItem
            actionType={item.actionType}
            key={item.actionType}
            limit={item.limit}
            remaining={item.remaining}
            used={item.used}
          />
        ))}
      </div>
    </Card>
  );
}
