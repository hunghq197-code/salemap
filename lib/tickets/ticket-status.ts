export const ticketStatusValues = [
  "new",
  "open",
  "waiting_on_customer",
  "waiting_on_support",
  "resolved",
  "closed",
  "cancelled",
] as const;

export const ticketPriorityValues = ["low", "normal", "high", "urgent"] as const;
export const ticketVisibilityValues = ["internal", "public"] as const;

export type TicketStatus = (typeof ticketStatusValues)[number];
export type TicketPriority = (typeof ticketPriorityValues)[number];
export type TicketVisibility = (typeof ticketVisibilityValues)[number];

function transitions(values: TicketStatus[]): ReadonlySet<TicketStatus> {
  return new Set(values);
}

const TICKET_TRANSITIONS: Record<TicketStatus, ReadonlySet<TicketStatus>> = {
  cancelled: transitions(["cancelled"]),
  closed: transitions(["open", "closed"]),
  new: transitions(["open", "waiting_on_support", "resolved", "cancelled"]),
  open: transitions([
    "waiting_on_customer",
    "waiting_on_support",
    "resolved",
    "cancelled",
  ]),
  resolved: transitions(["open", "closed", "resolved"]),
  waiting_on_customer: transitions([
    "open",
    "waiting_on_support",
    "resolved",
    "cancelled",
  ]),
  waiting_on_support: transitions([
    "open",
    "waiting_on_customer",
    "resolved",
    "cancelled",
  ]),
};

export function isValidTicketStatus(value?: string | null): value is TicketStatus {
  return ticketStatusValues.includes(value as TicketStatus);
}

export function isValidTicketTransition(from: TicketStatus, to: TicketStatus) {
  return from === to || TICKET_TRANSITIONS[from]?.has(to) || false;
}
