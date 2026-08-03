export const orderStatusValues = [
  "draft",
  "pending_payment",
  "waiting_confirmation",
  "paid",
  "provisioning",
  "completed",
  "cancelled",
  "expired",
  "failed",
  "refunded",
] as const;

export type OrderStatus = (typeof orderStatusValues)[number];

function transitions(values: OrderStatus[]): ReadonlySet<OrderStatus> {
  return new Set(values);
}

const ORDER_TRANSITIONS: Record<OrderStatus, ReadonlySet<OrderStatus>> = {
  cancelled: transitions(["cancelled"]),
  completed: transitions(["completed", "refunded"]),
  draft: transitions(["pending_payment", "cancelled"]),
  expired: transitions(["expired"]),
  failed: transitions(["failed"]),
  paid: transitions(["provisioning", "refunded"]),
  pending_payment: transitions([
    "waiting_confirmation",
    "paid",
    "cancelled",
    "expired",
    "failed",
  ]),
  provisioning: transitions(["completed", "failed"]),
  refunded: transitions(["refunded"]),
  waiting_confirmation: transitions(["paid", "cancelled", "failed"]),
};

export function isValidOrderStatus(value?: string | null): value is OrderStatus {
  return orderStatusValues.includes(value as OrderStatus);
}

export function isValidOrderTransition(from: OrderStatus, to: OrderStatus) {
  return ORDER_TRANSITIONS[from]?.has(to) ?? false;
}
