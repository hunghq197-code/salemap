import {
  CalendarClock,
  ExternalLink,
  MapPin,
  MessageSquarePlus,
  Navigation,
  Phone,
  StickyNote,
} from "lucide-react";
import Link from "next/link";
import { LeadPriorityBadge } from "@/components/leads/LeadPriorityBadge";
import { LeadStatusBadge } from "@/components/leads/LeadStatusBadge";
import type { LeadRecord } from "@/lib/data/leads";
import { getGoogleMapsDirectionsUrl } from "@/lib/maps-url";

type LeadCardProps = {
  lead: LeadRecord;
  selectable?: boolean;
};

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Chưa có";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Chưa có";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function getDirectionsHref(lead: LeadRecord) {
  return getGoogleMapsDirectionsUrl({
    address: lead.address,
    googleMapsUrl: lead.google_maps_url,
    latitude: lead.latitude,
    longitude: lead.longitude,
    placeId: lead.place_id,
  });
}

export function LeadCard({ lead, selectable = false }: LeadCardProps) {
  const isRouteLead = lead.source === "route_search";
  const isMapLead =
    !isRouteLead && (lead.external_source === "google_maps" || lead.source?.startsWith("map_"));
  const sourceBadgeLabel = isRouteLead ? "Từ tuyến đường" : isMapLead ? "Từ Google Maps" : null;
  const directionsHref = getDirectionsHref(lead);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-ocean">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          {selectable ? (
            <label className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-cloud">
              <input
                aria-label={`Chọn lead ${lead.name}`}
                className="h-5 w-5"
                name="leadIds"
                type="checkbox"
                value={lead.id}
              />
            </label>
          ) : null}
          <div className="min-w-0">
            <Link
              className="text-lg font-bold leading-7 text-ink hover:text-ocean"
              href={`/app/leads/${lead.id}`}
            >
              {lead.name}
            </Link>
            <div className="mt-2 flex flex-wrap gap-2">
              <LeadStatusBadge status={lead.status} />
              <LeadPriorityBadge priority={lead.priority} />
              {sourceBadgeLabel ? (
                <span className="inline-flex min-h-7 items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                  {sourceBadgeLabel}
                </span>
              ) : null}
            </div>
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
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink hover:border-ocean hover:text-ocean"
            href={`/app/leads/${lead.id}#add-note`}
          >
            <MessageSquarePlus aria-hidden="true" className="h-4 w-4" />
            Thêm ghi chú
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ocean"
            href={`/app/leads/${lead.id}`}
          >
            Xem chi tiết
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
        <p className="flex items-start gap-2 leading-6">
          <Phone aria-hidden="true" className="mt-1 h-4 w-4 flex-none text-ocean" />
          <span>{lead.phone || "Chưa có số điện thoại"}</span>
        </p>
        <p className="flex items-start gap-2 leading-6">
          <MapPin aria-hidden="true" className="mt-1 h-4 w-4 flex-none text-ocean" />
          <span>{lead.address || "Chưa có địa chỉ"}</span>
        </p>
        <p className="flex items-start gap-2 leading-6">
          <CalendarClock aria-hidden="true" className="mt-1 h-4 w-4 flex-none text-ocean" />
          <span>Follow-up: {formatDateTime(lead.next_follow_up_at)}</span>
        </p>
        <p className="flex items-start gap-2 leading-6">
          <CalendarClock aria-hidden="true" className="mt-1 h-4 w-4 flex-none text-ocean" />
          <span>Ngày tạo: {formatDate(lead.created_at)}</span>
        </p>
      </div>

      <p className="mt-4 flex items-start gap-2 text-sm leading-7 text-slate-600">
        <StickyNote aria-hidden="true" className="mt-1 h-4 w-4 flex-none text-ocean" />
        <span>{lead.note_summary || "Chưa có ghi chú gần nhất."}</span>
      </p>

      {lead.tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {lead.tags.map((tag) => (
            <span
              className="inline-flex min-h-7 items-center rounded-full bg-cloud px-3 py-1 text-xs font-bold text-slate-600"
              key={tag.id}
            >
              {tag.name}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}
