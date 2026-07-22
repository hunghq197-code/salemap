import {
  Archive,
  ArrowLeft,
  CalendarClock,
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
import { AddNoteForm } from "@/components/leads/AddNoteForm";
import { FollowUpForm } from "@/components/leads/FollowUpForm";
import { LeadDetailTracker } from "@/components/leads/LeadDetailTracker";
import { LeadForm } from "@/components/leads/LeadForm";
import { LeadPriorityBadge } from "@/components/leads/LeadPriorityBadge";
import { LeadStatusBadge } from "@/components/leads/LeadStatusBadge";
import { Toast } from "@/components/ui/Toast";
import { getInteractionTypeLabel } from "@/lib/constants/interaction-types";
import { isFeatureEnabled } from "@/lib/data/feature-flags";
import { getLeadById } from "@/lib/data/leads";
import { getLeadNotes } from "@/lib/data/lead-notes";
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
      <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-ink">Không tìm thấy lead</h1>
        <p className="mt-3 text-base leading-8 text-slate-600">
          Lead này có thể đã bị xóa hoặc không thuộc workspace của bạn.
        </p>
        <Link
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-lg bg-mint px-5 py-3 text-sm font-bold text-ink"
          href="/app/leads"
        >
          Quay lại danh sách lead
        </Link>
      </div>
    );
  }

  const [notes, mergeMetadata] = await Promise.all([
    getLeadNotes(lead.id),
    getLeadMergeMetadata(lead.id),
  ]);
  const showEditForm = getString(searchParams?.edit) === "1";
  const toastCode = getString(searchParams?.toast);
  const updateAction = updateLeadAction.bind(null, lead.id);
  const archiveAction = archiveLeadAction.bind(null, lead.id);
  const deleteAction = softDeleteLeadAction.bind(null, lead.id);
  const zaloPhone = cleanPhone(lead.phone);
  const isRouteLead = lead.source === "route_search";
  const isMapLead =
    !isRouteLead && (lead.external_source === "google_maps" || lead.source?.startsWith("map_"));
  const sourceBadgeLabel = isRouteLead ? "Từ tuyến đường" : isMapLead ? "Từ Google Maps" : null;
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
      label: "Lần liên hệ gần nhất",
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
    <div className="mx-auto max-w-6xl">
      <Toast code={toastCode} />
      <LeadDetailTracker priority={lead.priority} status={lead.status} />

      {mergeMetadata.mergedIntoLeadId ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
          Lead này đã được gộp vào lead khác.{" "}
          <Link className="font-bold text-ocean hover:text-ink" href={`/app/leads/${mergeMetadata.mergedIntoLeadId}`}>
            Xem lead chính
          </Link>
        </div>
      ) : mergeMetadata.mergedLeadCount > 0 ? (
        <div className="mb-4 rounded-lg border border-mint/40 bg-mint/10 p-4 text-sm font-semibold leading-6 text-ocean">
          Lead này đã gộp dữ liệu từ {mergeMetadata.mergedLeadCount} lead khác.
        </div>
      ) : null}

      <Link
        className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-ocean hover:text-ink"
        href="/app/leads"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Quay lại lead cá nhân
      </Link>

      <div className="mt-4 grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
                Lead detail
              </p>
              <h1 className="mt-3 text-3xl font-bold leading-tight text-ink sm:text-4xl">
                {lead.name}
              </h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <LeadStatusBadge status={lead.status} />
                <LeadPriorityBadge priority={lead.priority} />
                {sourceBadgeLabel ? (
                  <span className="inline-flex min-h-7 items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                    {sourceBadgeLabel}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {lead.phone ? (
                <a
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink hover:border-ocean hover:text-ocean"
                  href={`tel:${lead.phone}`}
                >
                  <Phone aria-hidden="true" className="h-4 w-4" />
                  Gọi
                </a>
              ) : null}
              {zaloPhone ? (
                <a
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink hover:border-ocean hover:text-ocean"
                  href={`https://zalo.me/${zaloPhone}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  <MessageCircle aria-hidden="true" className="h-4 w-4" />
                  Nhắn Zalo
                </a>
              ) : null}
              {directionsHref ? (
                <a
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink hover:border-ocean hover:text-ocean"
                  href={directionsHref}
                  rel="noreferrer"
                  target="_blank"
                >
                  <Navigation aria-hidden="true" className="h-4 w-4" />
                  Chỉ đường
                </a>
              ) : null}
              {lead.google_maps_url ? (
                <a
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink hover:border-ocean hover:text-ocean"
                  href={lead.google_maps_url}
                  rel="noreferrer"
                  target="_blank"
                >
                  <ExternalLink aria-hidden="true" className="h-4 w-4" />
                  Google Maps
                </a>
              ) : null}
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ocean"
                href={`/app/leads/${lead.id}?edit=1`}
              >
                Sửa
              </Link>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <a
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft hover:bg-[#5de0b3]"
              href="#add-note"
            >
              <MessageSquarePlus aria-hidden="true" className="h-5 w-5" />
              Thêm ghi chú
            </a>
            <a
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink hover:border-ocean hover:text-ocean"
              href="#create-follow-up"
            >
              <CalendarClock aria-hidden="true" className="h-5 w-5" />
              Tạo follow-up
            </a>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {infoItems.map(({ icon: Icon, label, value }) => (
              <div className="rounded-lg bg-cloud px-4 py-3" key={label}>
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  {label}
                </p>
                <p className="mt-2 break-words text-base font-bold text-ink">{value}</p>
              </div>
            ))}
          </div>

          {lead.tags.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {lead.tags.map((tag) => (
                <span
                  className="inline-flex min-h-8 items-center rounded-full bg-cloud px-3 py-1 text-xs font-bold text-slate-600"
                  key={tag.id}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-5 rounded-lg bg-cloud px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Ghi chú tóm tắt
            </p>
            <p className="mt-2 text-base leading-8 text-slate-600">
              {lead.note_summary || "Chưa có ghi chú cho lead này."}
            </p>
          </div>
        </section>

        <aside className="space-y-4">
          <section
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            id="create-follow-up"
          >
            <h2 className="text-lg font-bold text-ink">Tạo follow-up</h2>
            <FollowUpForm
              action={createLeadReminderAction}
              defaultRemindAt={tomorrowMorningLocal()}
              lead={lead}
              toastCode={toastCode}
            />
            <form action={createLeadReminderAction} className="hidden">
              <input name="leadId" type="hidden" value={lead.id} />
              <label className="block text-sm font-bold text-ink">
                Tiêu đề
                <input
                  className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
                  defaultValue={`Follow-up ${lead.name}`}
                  minLength={2}
                  name="title"
                  required
                />
              </label>
              <label className="block text-sm font-bold text-ink">
                Ngày giờ nhắc
                <input
                  className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
                  defaultValue={tomorrowMorningLocal()}
                  name="remindAt"
                  required
                  type="datetime-local"
                />
              </label>
              <label className="block text-sm font-bold text-ink">
                Mô tả
                <textarea
                  className="mt-2 min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-base leading-7 text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
                  maxLength={500}
                  name="description"
                  placeholder="Nội dung cần nhắc"
                />
              </label>
              <button
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft hover:bg-[#5de0b3]"
                type="submit"
              >
                <CalendarClock aria-hidden="true" className="h-5 w-5" />
                Tạo follow-up
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-ink">Quản lý lead</h2>
            <div className="mt-4 grid gap-2">
              <form action={archiveAction}>
                <button
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink hover:border-ocean hover:text-ocean"
                  type="submit"
                >
                  <Archive aria-hidden="true" className="h-4 w-4" />
                  Archive
                </button>
              </form>
              <form action={deleteAction}>
                <button
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100"
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

      {showEditForm ? (
        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-ink">Sửa thông tin lead</h2>
            <Link
              className="text-sm font-bold text-ocean hover:text-ink"
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

      <section className="mt-5">
        {aiEnabled ? (
          <AIAssistantPanel leadId={lead.id} title="Trợ lý AI cho lead này" />
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-5 text-base leading-8 text-slate-600 shadow-sm">
            Trợ lý AI đang được mở dần.
          </div>
        )}
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div id="add-note">
          <h2 className="mb-3 text-xl font-bold text-ink">Thêm ghi chú</h2>
          <AddNoteForm action={createLeadNoteAction} lead={lead} toastCode={toastCode} />
        </div>
        <div>
          <h2 className="mb-3 text-xl font-bold text-ink">Lịch sử ghi chú</h2>
          {notes.length > 0 ? (
            <div className="space-y-3">
              {notes.map((note) => (
                <article
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                  key={note.id}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-bold text-ocean">
                      {getInteractionTypeLabel(note.interaction_type)}
                    </p>
                    <p className="text-sm font-semibold text-slate-500">
                      {formatDateTime(note.contacted_at)}
                    </p>
                  </div>
                  <p className="mt-3 whitespace-pre-line text-base leading-8 text-slate-700">
                    {note.content}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
                    <span>Kết quả: {note.outcome || "Chưa phân loại"}</span>
                    <span>Trạng thái sau:</span>
                    <LeadStatusBadge status={note.status_after} />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-5 text-base leading-8 text-slate-600 shadow-sm">
              Chưa có ghi chú nào cho lead này.
            </div>
          )}
        </div>
      </section>

      <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-3 right-3 z-40 grid grid-cols-4 gap-2 rounded-lg border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur lg:hidden">
        {lead.phone ? (
          <a
            className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg bg-mint/20 px-1 text-[11px] font-bold text-ink"
            href={`tel:${lead.phone}`}
          >
            <Phone aria-hidden="true" className="h-5 w-5" />
            Gọi
          </a>
        ) : (
          <span className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg bg-slate-100 px-1 text-[11px] font-bold text-slate-400">
            <Phone aria-hidden="true" className="h-5 w-5" />
            Gọi
          </span>
        )}
        {zaloPhone ? (
          <a
            className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg bg-cloud px-1 text-[11px] font-bold text-ink"
            href={`https://zalo.me/${zaloPhone}`}
            rel="noreferrer"
            target="_blank"
          >
            <MessageCircle aria-hidden="true" className="h-5 w-5" />
            Nhắn
          </a>
        ) : (
          <span className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg bg-slate-100 px-1 text-[11px] font-bold text-slate-400">
            <MessageCircle aria-hidden="true" className="h-5 w-5" />
            Nhắn
          </span>
        )}
        <a
          className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg bg-ink px-1 text-[11px] font-bold text-white"
          href="#add-note"
        >
          <MessageSquarePlus aria-hidden="true" className="h-5 w-5" />
          Ghi chú
        </a>
        <a
          className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg bg-cloud px-1 text-[11px] font-bold text-ink"
          href="#create-follow-up"
        >
          <CalendarClock aria-hidden="true" className="h-5 w-5" />
          Nhắc
        </a>
      </div>
    </div>
  );
}
