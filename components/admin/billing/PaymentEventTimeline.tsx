import { Clock3 } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import type { AdminPaymentEvent } from "@/lib/admin/data/billing-payments";

type PaymentEventTimelineProps = {
  events: AdminPaymentEvent[];
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
      normalized.includes("signature") ||
      normalized.includes("checksum") ||
      normalized.includes("secret") ||
      normalized.includes("payload") ||
      normalized.includes("url")
    );
  });
}

export function PaymentEventTimeline({ events }: PaymentEventTimelineProps) {
  if (events.length === 0) {
    return (
      <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
        Chưa có payment event nào.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {events.map((event) => (
        <li className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={event.id}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Clock3 aria-hidden="true" className="h-4 w-4 text-ocean" />
                <h3 className="break-words font-bold text-ink">{event.event_type}</h3>
                <AdminStatusBadge value={event.processed ? "processed" : "received"} />
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {formatDate(event.created_at)} · {event.provider || "provider unknown"} · order{" "}
                {event.order_code || "n/a"}
              </p>
            </div>
          </div>

          {safeEntries(event.safe_event).length > 0 ? (
            <dl className="mt-3 grid gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs sm:grid-cols-2">
              {safeEntries(event.safe_event).map(([key, value]) => (
                <div className="min-w-0" key={key}>
                  <dt className="font-bold uppercase tracking-[0.1em] text-slate-500">{key}</dt>
                  <dd className="mt-1 break-words font-semibold text-slate-700">
                    {String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          {event.processing_error ? (
            <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              Processing error: {event.processing_error}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
