import { CalendarClock, MessageSquareText } from "lucide-react";
import { LeadStatusBadge } from "@/components/leads/LeadStatusBadge";
import { getInteractionTypeLabel } from "@/lib/constants/interaction-types";
import { getTaskStatusLabel } from "@/lib/constants/tasks";
import type { LeadNoteRecord } from "@/lib/data/lead-notes";

type TaskEventRecord = {
  created_at?: string | null;
  event_type?: string | null;
  from_status?: string | null;
  id: string;
  metadata?: Record<string, unknown> | null;
  reminder_id?: string | null;
  to_status?: string | null;
};

type LeadTimelineProps = {
  events: TaskEventRecord[];
  leadCreatedAt?: string | null;
  notes: LeadNoteRecord[];
};

type TimelineItem =
  | {
      content: string;
      date?: string | null;
      id: string;
      kind: "note";
      meta?: string | null;
      statusAfter?: string | null;
      title: string;
    }
  | {
      content: string;
      date?: string | null;
      id: string;
      kind: "event";
      meta?: string | null;
      title: string;
    };

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Chưa có";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getEventLabel(eventType?: string | null) {
  if (eventType === "created") return "Đã tạo task";
  if (eventType === "completed") return "Đã hoàn thành task";
  if (eventType === "snoozed") return "Đã dời lịch task";
  if (eventType === "cancelled") return "Đã hủy task";
  if (eventType === "reopened") return "Đã mở lại task";
  if (eventType === "note_added") return "Đã thêm ghi chú";
  if (eventType === "lead_status_updated") return "Đã đổi trạng thái lead";
  return "Cập nhật task";
}

export function LeadTimeline({
  events,
  leadCreatedAt,
  notes,
}: LeadTimelineProps) {
  const items: TimelineItem[] = [
    ...notes.map((note) => ({
      content: note.content,
      date: note.contacted_at || note.created_at,
      id: `note:${note.id}`,
      kind: "note" as const,
      meta: `Kết quả: ${note.outcome || "Chưa phân loại"}`,
      statusAfter: note.status_after,
      title: getInteractionTypeLabel(note.interaction_type),
    })),
    ...events.map((event) => ({
      content:
        event.from_status || event.to_status
          ? `${getTaskStatusLabel(event.from_status)} → ${getTaskStatusLabel(event.to_status)}`
          : "Task được cập nhật.",
      date: event.created_at,
      id: `event:${event.id}`,
      kind: "event" as const,
      meta: event.metadata?.taskType ? `Loại: ${String(event.metadata.taskType)}` : null,
      title: getEventLabel(event.event_type),
    })),
    {
      content: "Lead được tạo trong workspace SaleMap.",
      date: leadCreatedAt,
      id: "lead-created",
      kind: "event" as const,
      meta: null,
      title: "Lead được tạo",
    },
  ].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold text-ink">Timeline</h2>
      <div className="mt-5 space-y-3">
        {items.map((item) => {
          const Icon = item.kind === "note" ? MessageSquareText : CalendarClock;

          return (
            <article className="flex gap-3 rounded-lg bg-cloud p-4" key={item.id}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-ocean">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-bold text-ink">{item.title}</p>
                  <p className="text-sm font-semibold text-slate-500">
                    {formatDateTime(item.date)}
                  </p>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                  {item.content}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                  {item.meta ? <span>{item.meta}</span> : null}
                  {item.kind === "note" && item.statusAfter ? (
                    <LeadStatusBadge status={item.statusAfter} />
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
