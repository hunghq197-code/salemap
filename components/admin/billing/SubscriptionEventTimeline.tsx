import { CalendarClock } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import type { AdminSubscriptionEvent } from "@/lib/admin/data/subscriptions";

type SubscriptionEventTimelineProps = {
  events: AdminSubscriptionEvent[];
};

function formatDate(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "Chưa có";
}

function safeEntries(value?: Record<string, unknown> | null) {
  if (!value) return [];

  return Object.entries(value).filter(([key]) => {
    const normalized = key.toLowerCase();

    return !(
      normalized.includes("secret") ||
      normalized.includes("signature") ||
      normalized.includes("checksum") ||
      normalized.includes("payload")
    );
  });
}

export function SubscriptionEventTimeline({ events }: SubscriptionEventTimelineProps) {
  if (events.length === 0) {
    return (
      <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
        Chưa có subscription event nào.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {events.map((event) => (
        <li className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={event.id}>
          <div className="flex flex-wrap items-center gap-2">
            <CalendarClock aria-hidden="true" className="h-4 w-4 text-ocean" />
            <h3 className="font-bold text-ink">{event.event_type}</h3>
            {event.to_status ? <AdminStatusBadge value={event.to_status} /> : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {formatDate(event.created_at)} · {event.from_plan_key || event.from_plan_id || "-"} →{" "}
            {event.to_plan_key || event.to_plan_id || "-"}
          </p>
          <dl className="mt-3 grid gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs sm:grid-cols-2">
            <div>
              <dt className="font-bold uppercase tracking-[0.1em] text-slate-500">Period</dt>
              <dd className="mt-1 font-semibold text-slate-700">
                {formatDate(event.previous_period_end)} → {formatDate(event.new_period_end)}
              </dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-[0.1em] text-slate-500">Payment</dt>
              <dd className="mt-1 break-all font-mono font-semibold text-slate-700">
                {event.payment_id || event.payment_request_id || "Không có"}
              </dd>
            </div>
            {safeEntries(event.metadata).map(([key, value]) => (
              <div className="min-w-0" key={key}>
                <dt className="font-bold uppercase tracking-[0.1em] text-slate-500">{key}</dt>
                <dd className="mt-1 break-words font-semibold text-slate-700">
                  {String(value)}
                </dd>
              </div>
            ))}
          </dl>
          {event.note ? (
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{event.note}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
