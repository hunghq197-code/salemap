import { ReceiptText } from "lucide-react";
import { PaymentHistoryItem } from "@/components/billing/PaymentHistoryItem";
import { Card } from "@/components/ui/Card";
import type { SafeBillingPayment } from "@/lib/billing/types";

type PaymentHistoryProps = {
  items: SafeBillingPayment[];
};

export function PaymentHistory({ items }: PaymentHistoryProps) {
  return (
    <Card>
      <div className="flex gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
          <ReceiptText aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-text-primary">Lịch sử thanh toán</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
            Theo dõi payment order, provider và trạng thái xử lý gần đây của tài khoản.
          </p>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="mt-5 space-y-3">
          {items.map((payment) => (
            <PaymentHistoryItem key={payment.id} payment={payment} />
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-control border border-border-soft bg-surface-muted px-4 py-3 text-sm font-semibold leading-6 text-text-secondary">
          Bạn chưa có payment order nào.
        </p>
      )}
    </Card>
  );
}
