import {
  Archive,
  ArrowLeft,
  CalendarClock,
  Edit3,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquarePlus,
  Navigation,
  Phone,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
  archiveLeadAction,
  createLeadNoteAction,
  createLeadReminderAction,
  softDeleteLeadAction,
  updateLeadAction,
} from "@/app/app/leads/actions";
import { AIAssistantPanel } from "@/components/ai/AIAssistantPanel";
import { LeadCadencePanel } from "@/components/cadences/LeadCadencePanel";
import { AddNoteForm } from "@/components/leads/AddNoteForm";
import { FollowUpForm } from "@/components/leads/FollowUpForm";
import { LeadDetailTracker } from "@/components/leads/LeadDetailTracker";
import { LeadForm } from "@/components/leads/LeadForm";
import { LeadPriorityBadge } from "@/components/leads/LeadPriorityBadge";
import { LeadStatusBadge } from "@/components/leads/LeadStatusBadge";
import { LeadTaskPanel } from "@/components/leads/LeadTaskPanel";
import { LeadTimeline } from "@/components/leads/LeadTimeline";
import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import { TaskTypeBadge } from "@/components/tasks/TaskTypeBadge";
import { Badge } from "@/components/ui/Badge";
import { Toast } from "@/components/ui/Toast";
import { getLeadActiveCadence } from "@/lib/data/cadences";
import { isFeatureEnabled } from "@/lib/data/feature-flags";
import { getLeadNotes } from "@/lib/data/lead-notes";
import { getLeadById, type LeadRecord } from "@/lib/data/leads";
import { getLeadTaskTimeline, getLeadTasks, type TaskRecord } from "@/lib/data/tasks";
import { getTags } from "@/lib/data/tags";
import { getLeadMergeMetadata } from "@/lib/leads/merge-leads";
import { getGoogleMapsDirectionsUrl } from "@/lib/maps-url";

export const dynamic = "force-dynamic";

type LeadDetailPageProps = {
  params: Promise<{
    leadId: string;
  }>;
  searchParams?: Record<string, string | string[] | undefined>;
};

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Chưa có";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function tomorrowMorningLocal() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function cleanPhone(phone?: string | null) {
  return phone?.replace(/\D/g, "") || "";
}

function isOpenTask(task: TaskRecord) {
  return task.status === "pending" || task.status === "snoozed";
}

function isOverdue(value?: string | null) {
  return Boolean(value && new Date(value).getTime() < Date.now());
}

function getNextTask(tasks: TaskRecord[]) {
  return tasks
    .filter(isOpenTask)
    .sort(
      (a, b) =>
        new Date(a.remind_at || 0).getTime() - new Date(b.remind_at || 0).getTime(),
    )[0];
}

function getSourceBadgeLabel(lead: LeadRecord) {
  if (lead.source === "route_search") return "Từ tuyến đường";
  if (lead.external_source === "google_maps" || lead.source?.startsWith("map_")) {
    return "Từ Google Maps";
  }
  return null;
}

function FieldItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-control bg-surface-muted px-4 py-3">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
        <Icon aria-hidden="true" className="h-4 w-4" />
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-bold leading-6 text-text-primary">
        {value}
      </p>
    </div>
  );
}

function LeadNextAction({ lead, tasks }: { lead: LeadRecord; tasks: TaskRecord[] }) {
  const nextTask = getNextTask(tasks);

  if (!nextTask) {
    return (
      <section className="rounded-card border border-border-soft bg-surface p-4 shadow-card sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-text-muted">Next action</p>
            <h2 className="mt-2 text-xl font-bold text-text-primary">
              Chưa có follow-up mở
            </h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Tạo lịch chăm sóc tiếp theo cho {lead.name} để không mất nhịp.
            </p>
          </div>
          <a
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-primary px-5 py-3 text-base font-bold text-white shadow-soft transition hover:bg-primary-hover"
            href="#lead-tasks"
          >
            <CalendarClock aria-hidden="true" className="h-5 w-5" />
            Tạo follow-up
          </a>
        </div>
      </section>
    );
  }

  const overdue = isOverdue(nextTask.remind_at);

  return (
    <section
      className={[
        "rounded-card border bg-surface p-4 shadow-card sm:p-5",
        overdue ? "border-danger/35" : "border-border-soft",
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-text-muted">Next action</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <TaskTypeBadge type={nextTask.task_type} />
            <TaskPriorityBadge priority={nextTask.priority} />
            {overdue ? <Badge tone="danger">Quá hạn</Badge> : null}
          </div>
          <h2 className="mt-3 text-xl font-bold leading-7 text-text-primary">
            {nextTask.title}
          </h2>
          <p
            className={[
              "mt-2 flex items-center gap-2 text-sm font-semibold",
              overdue ? "text-danger" : "text-text-secondary",
            ].join(" ")}
          >
            <CalendarClock aria-hidden="true" className="h-4 w-4" />
            {formatDateTime(nextTask.remind_at)}
          </p>
          {nextTask.description ? (
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-text-secondary">
              {nextTask.description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <a
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-4 py-2 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
            href="#lead-tasks"
          >
            Xử lý task
          </a>
          <a
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-4 py-2 text-sm font-bold text-white shadow-soft transition hover:bg-primary-hover"
            href="#add-note"
          >
            <MessageSquarePlus aria-hidden="true" className="h-4 w-4" />
            Ghi chú
          </a>
        </div>
      </div>
    </section>
  );
}

export default async function LeadDetailPage(props: LeadDetailPageProps) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const [lead, tags, aiEnabled] = await Promise.all([
    getLeadById(params.leadId),
    getTags(),
    isFeatureEnabled("ai_assistant"),
  ]);

  if (!lead) {
    return (
      <div className="mx-auto max-w-3xl rounded-card border border-border-soft bg-surface p-6 shadow-card">
        <h1 className="text-2xl font-bold text-text-primary">Không tìm thấy lead</h1>
        <p className="mt-3 text-base leading-8 text-text-secondary">
          Lead này có thể đã bị xóa hoặc không thuộc workspace của bạn.
        </p>
        <Link
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-control bg-primary px-5 py-3 text-sm font-bold text-white"
          href="/app/leads"
        >
          Quay lại danh sách lead
        </Link>
      </div>
    );
  }

  const [notes, mergeMetadata, leadTasks, taskTimeline, activeCadence] =
    await Promise.all([
      getLeadNotes(lead.id, 20).catch(() => []),
      getLeadMergeMetadata(lead.id).catch(() => ({
        mergedIntoLeadId: null,
        mergedLeadCount: 0,
      })),
      getLeadTasks(lead.id).catch(() => []),
      getLeadTaskTimeline(lead.id).catch(() => ({ events: [], notes: [] })),
      getLeadActiveCadence(lead.id).catch(() => null),
    ]);
  const showEditForm = getString(searchParams?.edit) === "1";
  const toastCode = getString(searchParams?.toast);
  const updateAction = updateLeadAction.bind(null, lead.id);
  const archiveAction = archiveLeadAction.bind(null, lead.id);
  const deleteAction = softDeleteLeadAction.bind(null, lead.id);
  const zaloPhone = cleanPhone(lead.phone);
  const sourceBadgeLabel = getSourceBadgeLabel(lead);
  const directionsHref = getGoogleMapsDirectionsUrl({
    address: lead.address,
    googleMapsUrl: lead.google_maps_url,
    latitude: lead.latitude,
    longitude: lead.longitude,
    placeId: lead.place_id,
  });
  const infoItems: Array<{ icon: LucideIcon; label: string; value: string }> = [
    { icon: Phone, label: "Số điện thoại", value: lead.phone || "Chưa có" },
    { icon: Mail, label: "Email", value: lead.email || "Chưa có" },
    { icon: Globe, label: "Website", value: lead.website || "Chưa có" },
    { icon: MapPin, label: "Địa chỉ", value: lead.address || "Chưa có" },
    { icon: MapPin, label: "Ngành/loại khách", value: lead.category || "Chưa có" },
    { icon: Globe, label: "Nguồn lead", value: sourceBadgeLabel || lead.source || "manual" },
    { icon: CalendarClock, label: "Ngày tạo", value: formatDateTime(lead.created_at) },
    {
      icon: CalendarClock,
      label: "Liên hệ gần nhất",
      value: formatDateTime(lead.last_contacted_at),
    },
    {
      icon: CalendarClock,
      label: "Follow-up tiếp theo",
      value: formatDateTime(lead.next_follow_up_at),
    },
    {
      icon: Globe,
      label: "Đánh giá",
      value: lead.rating ? `${lead.rating}/5 (${lead.user_ratings_total || 0})` : "Chưa có",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl pb-24 lg:pb-0">
      <Toast code={toastCode} />
      <LeadDetailTracker priority={lead.priority} status={lead.status} />

      {mergeMetadata.mergedIntoLeadId ? (
        <div className="mb-4 rounded-card border border-warning/25 bg-warning-soft p-4 text-sm font-semibold leading-6 text-amber-900">
          Lead này đã được gộp vào lead khác.{" "}
          <Link
            className="font-bold text-primary hover:text-text-primary"
            href={`/app/leads/${mergeMetadata.mergedIntoLeadId}`}
          >
            Xem lead chính
          </Link>
        </div>
      ) : mergeMetadata.mergedLeadCount > 0 ? (
        <div className="mb-4 rounded-card border border-success/25 bg-success-soft p-4 text-sm font-semibold leading-6 text-emerald-800">
          Lead này đã gộp dữ liệu từ {mergeMetadata.mergedLeadCount} lead khác.
        </div>
      ) : null}

      <Link
        className="inline-flex min-h-11 items-center gap-2 rounded-control text-sm font-bold text-primary hover:text-text-primary"
        href="/app/leads"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Quay lại danh sách
      </Link>

      <section className="mt-4 rounded-card border border-border-soft bg-surface p-4 shadow-card sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Lead detail
            </p>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
              {lead.name}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <LeadStatusBadge status={lead.status} />
              <LeadPriorityBadge priority={lead.priority} />
              {sourceBadgeLabel ? <Badge tone="accent">{sourceBadgeLabel}</Badge> : null}
              {lead.category ? <Badge tone="neutral">{lead.category}</Badge> : null}
            </div>
            {lead.address ? (
              <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-text-secondary">
                <MapPin aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" />
                <span>{lead.address}</span>
              </p>
            ) : null}
            {lead.tags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {lead.tags.map((tag) => (
                  <Badge key={tag.id} tone="outline">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>

          <div className="hidden flex-wrap gap-2 lg:flex lg:justify-end">
            <a
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-primary px-5 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-primary-hover"
              href="#lead-tasks"
            >
              <CalendarClock aria-hidden="true" className="h-5 w-5" />
              Tạo follow-up
            </a>
            {lead.phone ? (
              <a
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-4 py-3 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
                href={`tel:${lead.phone}`}
              >
                <Phone aria-hidden="true" className="h-5 w-5" />
                Gọi
              </a>
            ) : null}
            {directionsHref ? (
              <a
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-4 py-3 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
                href={directionsHref}
                rel="noreferrer"
                target="_blank"
              >
                <Navigation aria-hidden="true" className="h-5 w-5" />
                Chỉ đường
              </a>
            ) : null}
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-4 py-3 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
              href={`/app/leads/${lead.id}?edit=1`}
            >
              <Edit3 aria-hidden="true" className="h-5 w-5" />
              Sửa
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          <LeadNextAction lead={lead} tasks={leadTasks} />

          {showEditForm ? (
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-text-primary">Sửa thông tin lead</h2>
                <Link
                  className="text-sm font-bold text-primary hover:text-text-primary"
                  href={`/app/leads/${lead.id}`}
                >
                  Đóng
                </Link>
              </div>
              <LeadForm
                action={updateAction}
                cancelHref={`/app/leads/${lead.id}`}
                lead={lead}
                submitLabel="Lưu lead"
                tags={tags}
                toastCode={toastCode}
              />
            </section>
          ) : null}

          <LeadTaskPanel lead={lead} tasks={leadTasks} />

          <section id="add-note">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-text-primary">Thêm ghi chú</h2>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Lưu kết quả liên hệ, trạng thái sau tương tác và follow-up nếu cần.
              </p>
            </div>
            <AddNoteForm action={createLeadNoteAction} lead={lead} toastCode={toastCode} />
          </section>

          <LeadTimeline
            events={taskTimeline.events}
            leadCreatedAt={lead.created_at}
            notes={notes}
          />

          {aiEnabled ? (
            <AIAssistantPanel leadId={lead.id} title="Trợ lý AI cho lead này" />
          ) : (
            <section className="rounded-card border border-border-soft bg-surface p-5 text-base leading-8 text-text-secondary shadow-card">
              Trợ lý AI đang được mở dần.
            </section>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-card border border-border-soft bg-surface p-4 shadow-card sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-text-muted">Liên hệ</p>
                <h2 className="mt-1 text-xl font-bold text-text-primary">{lead.name}</h2>
              </div>
              <LeadStatusBadge status={lead.status} />
            </div>

            <div className="mt-4 grid gap-3">
              {lead.phone ? (
                <a
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-primary px-4 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-primary-hover"
                  href={`tel:${lead.phone}`}
                >
                  <Phone aria-hidden="true" className="h-5 w-5" />
                  Gọi khách
                </a>
              ) : null}
              {zaloPhone ? (
                <a
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-4 py-3 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
                  href={`https://zalo.me/${zaloPhone}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  <MessageCircle aria-hidden="true" className="h-5 w-5" />
                  Nhắn Zalo
                </a>
              ) : null}
              {directionsHref ? (
                <a
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-4 py-3 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
                  href={directionsHref}
                  rel="noreferrer"
                  target="_blank"
                >
                  <Navigation aria-hidden="true" className="h-5 w-5" />
                  Chỉ đường
                </a>
              ) : null}
              {lead.google_maps_url ? (
                <a
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-4 py-3 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
                  href={lead.google_maps_url}
                  rel="noreferrer"
                  target="_blank"
                >
                  <ExternalLink aria-hidden="true" className="h-5 w-5" />
                  Google Maps
                </a>
              ) : null}
            </div>

            <div className="mt-5 grid gap-3">
              {infoItems.map((item) => (
                <FieldItem
                  icon={item.icon}
                  key={item.label}
                  label={item.label}
                  value={item.value}
                />
              ))}
            </div>

            <div className="mt-5 rounded-control bg-surface-muted px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
                Ghi chú tóm tắt
              </p>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                {lead.note_summary || "Chưa có ghi chú cho lead này."}
              </p>
            </div>
          </section>

          <section
            className="rounded-card border border-border-soft bg-surface p-4 shadow-card sm:p-5"
            id="create-follow-up"
          >
            <h2 className="text-lg font-bold text-text-primary">Tạo follow-up</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Lên lịch việc tiếp theo cho riêng lead này.
            </p>
            <FollowUpForm
              action={createLeadReminderAction}
              defaultRemindAt={tomorrowMorningLocal()}
              lead={lead}
              toastCode={toastCode}
            />
          </section>

          <LeadCadencePanel activeCadence={activeCadence} lead={lead} />

          <section className="rounded-card border border-border-soft bg-surface p-4 shadow-card sm:p-5">
            <h2 className="text-lg font-bold text-text-primary">Quản lý lead</h2>
            <div className="mt-4 grid gap-2">
              <Link
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-4 py-2 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
                href={`/app/leads/${lead.id}?edit=1`}
              >
                <Edit3 aria-hidden="true" className="h-4 w-4" />
                Sửa thông tin
              </Link>
              <form action={archiveAction}>
                <button
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-4 py-2 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
                  type="submit"
                >
                  <Archive aria-hidden="true" className="h-4 w-4" />
                  Archive
                </button>
              </form>
              <form action={deleteAction}>
                <button
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control border border-danger/20 bg-danger-soft px-4 py-2 text-sm font-bold text-danger transition hover:bg-red-100"
                  type="submit"
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                  Xóa mềm lead
                </button>
              </form>
            </div>
          </section>
        </aside>
      </div>

      <div
        className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-3 right-3 z-40 grid grid-cols-4 gap-2 rounded-card border border-border-soft bg-surface/95 p-2 shadow-floating backdrop-blur lg:hidden"
        data-testid="lead-mobile-action-bar"
      >
        {lead.phone ? (
          <a
            className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-control bg-primary-soft px-1 text-[11px] font-bold text-primary"
            href={`tel:${lead.phone}`}
          >
            <Phone aria-hidden="true" className="h-5 w-5" />
            Gọi
          </a>
        ) : (
          <span className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-control bg-surface-muted px-1 text-[11px] font-bold text-text-muted">
            <Phone aria-hidden="true" className="h-5 w-5" />
            Gọi
          </span>
        )}
        {directionsHref ? (
          <a
            className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-control bg-surface-muted px-1 text-[11px] font-bold text-text-primary"
            href={directionsHref}
            rel="noreferrer"
            target="_blank"
          >
            <Navigation aria-hidden="true" className="h-5 w-5" />
            Đường
          </a>
        ) : (
          <span className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-control bg-surface-muted px-1 text-[11px] font-bold text-text-muted">
            <Navigation aria-hidden="true" className="h-5 w-5" />
            Đường
          </span>
        )}
        <a
          className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-control bg-surface-muted px-1 text-[11px] font-bold text-text-primary"
          href="#add-note"
        >
          <MessageSquarePlus aria-hidden="true" className="h-5 w-5" />
          Ghi chú
        </a>
        <a
          className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-control bg-primary px-1 text-[11px] font-bold text-white"
          href="#lead-tasks"
        >
          <CalendarClock aria-hidden="true" className="h-5 w-5" />
          Nhắc
        </a>
      </div>
    </div>
  );
}
