import { BellRing, CalendarClock, CheckCircle2, ExternalLink, MailCheck, Phone, RotateCcw } from "lucide-react";
import Link from "next/link";
import {
  completeReminderAction,
  snoozeReminderAction,
} from "@/app/app/reminders/actions";
import { LeadStatusBadge } from "@/components/leads/LeadStatusBadge";
import type { ReminderRecord } from "@/lib/data/reminders";
import type { ReminderTab } from "@/lib/validators/reminder";

type ReminderCardProps = {
  reminder: ReminderRecord;
  tab: ReminderTab;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function getReminderStatusLabel(status?: string | null) {
  return status === "done" ? "Đã xong" : "Đang chờ";
}

function getDeliveryLabels(reminder: ReminderRecord) {
  const labels: Array<{ icon: typeof BellRing; label: string }> = [];

  if (reminder.notification_sent_at) {
    labels.push({ icon: BellRing, label: "Đã nhắc trong app" });
  }

  if (reminder.email_sent_at) {
    labels.push({ icon: MailCheck, label: "Đã gửi email" });
  }

  if (labels.length === 0 && reminder.status !== "done") {
    labels.push({ icon: BellRing, label: "Chưa gửi nhắc" });
  }

  return labels;
}

export function ReminderCard({ reminder, tab }: ReminderCardProps) {
  const completeAction = completeReminderAction.bind(null, reminder.id, tab);
  const snoozeAction = snoozeReminderAction.bind(null, reminder.id, tab);
  const lead = Array.isArray(reminder.leads) ? reminder.leads[0] : reminder.leads;
  const isDone = reminder.status === "done";
  const deliveryLabels = getDeliveryLabels(reminder);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold leading-7 text-ink">{reminder.title}</h2>
            <span
              className={[
                "inline-flex min-h-7 items-center rounded-full border px-3 py-1 text-xs font-bold",
                isDone
                  ? "border-mint/40 bg-mint/15 text-ocean"
                  : "border-amber-200 bg-amber-50 text-amber-700",
              ].join(" ")}
            >
              {getReminderStatusLabel(reminder.status)}
            </span>
          </div>
          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
            <CalendarClock aria-hidden="true" className="h-4 w-4 text-ocean" />
            {formatDateTime(reminder.remind_at)}
          </p>
          {lead ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm leading-6 text-slate-600">
              <span>Lead:</span>
              <Link className="font-bold text-ocean hover:text-ink" href={`/app/leads/${lead.id}`}>
                {lead.name}
              </Link>
              <LeadStatusBadge status={lead.status} />
              {lead.phone ? <span>{lead.phone}</span> : null}
            </div>
          ) : null}
          {reminder.description ? (
            <p className="mt-3 text-sm leading-7 text-slate-600">{reminder.description}</p>
          ) : null}
          {deliveryLabels.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {deliveryLabels.map((item) => {
                const Icon = item.icon;

                return (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600"
                    key={item.label}
                  >
                    <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                    {item.label}
                  </span>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          {lead?.phone ? (
            <a
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink hover:border-ocean hover:text-ocean"
              href={`tel:${lead.phone}`}
            >
              <Phone aria-hidden="true" className="h-4 w-4" />
              Gọi
            </a>
          ) : null}
          {lead ? (
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink hover:border-ocean hover:text-ocean"
              href={`/app/leads/${lead.id}`}
            >
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
              Xem lead
            </Link>
          ) : null}
          {!isDone ? (
            <>
              <form action={snoozeAction}>
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink hover:border-ocean hover:text-ocean"
                  type="submit"
                >
                  <RotateCcw aria-hidden="true" className="h-4 w-4" />
                  Dời lịch
                </button>
              </form>
              <form action={completeAction}>
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-mint px-3 py-2 text-sm font-bold text-ink hover:bg-[#5de0b3]"
                  type="submit"
                >
                  <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                  Hoàn thành
                </button>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}
