import { Badge } from "@/components/ui/Badge";
import {
  getPaymentStatusPresentation,
  getSubscriptionStatusPresentation,
} from "@/lib/design-system/status";

type PaymentStatusBadgeProps = {
  className?: string;
  kind?: "payment" | "subscription";
  status?: string | null;
};

export function PaymentStatusBadge({
  className,
  kind = "payment",
  status,
}: PaymentStatusBadgeProps) {
  const presentation =
    kind === "subscription"
      ? getSubscriptionStatusPresentation(status)
      : getPaymentStatusPresentation(status);

  return (
    <Badge className={className} tone={presentation.badgeVariant}>
      {presentation.label}
    </Badge>
  );
}
