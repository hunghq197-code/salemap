import {
  AlertTriangle,
  CalendarClock,
  HeartHandshake,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

type LeadSummaryCardsProps = {
  counts: {
    interested: number;
    overdue: number;
    today: number;
    total: number;
  };
};

const items = [
  {
    description: "Lead active trong workspace",
    href: "/app/leads",
    icon: UsersRound,
    key: "total",
    label: "Tổng lead",
    tone: "bg-primary-soft text-primary",
  },
  {
    description: "Cần chăm sóc trong ngày",
    href: "/app/leads?followUp=today",
    icon: CalendarClock,
    key: "today",
    label: "Hôm nay",
    tone: "bg-warning-soft text-amber-700",
  },
  {
    description: "Nên xử lý trước",
    href: "/app/leads?followUp=overdue",
    icon: AlertTriangle,
    key: "overdue",
    label: "Quá hạn",
    tone: "bg-danger-soft text-danger",
  },
  {
    description: "Đang có tín hiệu tốt",
    href: "/app/leads?status=interested",
    icon: HeartHandshake,
    key: "interested",
    label: "Quan tâm",
    tone: "bg-success-soft text-emerald-700",
  },
] as const;

export function LeadSummaryCards({ counts }: LeadSummaryCardsProps) {
  return (
    <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        const value = counts[item.key];

        return (
          <Link
            className="rounded-card border border-border-soft bg-surface p-4 shadow-card transition hover:border-primary/40 hover:shadow-floating sm:p-5"
            href={item.href}
            key={item.key}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-bold text-text-secondary">{item.label}</p>
                <p className="mt-3 text-3xl font-bold tabular-nums text-text-primary">
                  {value}
                </p>
              </div>
              <span
                className={[
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-control",
                  item.tone,
                ].join(" ")}
              >
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-text-secondary">
              {item.description}
            </p>
          </Link>
        );
      })}
    </section>
  );
}
