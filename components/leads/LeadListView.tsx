"use client";

import {
  CalendarClock,
  ExternalLink,
  MapPinned,
  MessageSquarePlus,
  Navigation,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LeadPriorityBadge } from "@/components/leads/LeadPriorityBadge";
import { LeadStatusBadge } from "@/components/leads/LeadStatusBadge";
import { Badge } from "@/components/ui/Badge";
import type { LeadRecord } from "@/lib/data/leads";
import { getGoogleMapsDirectionsUrl } from "@/lib/maps-url";

type LeadListViewProps = {
  leads: LeadRecord[];
};

function formatDate(value?: string | null) {
  if (!value) return "Chưa có";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value?: string | null) {
  if (!value) return "Chưa có lịch";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

function getSourceLabel(lead: LeadRecord) {
  if (lead.source === "route_search") return "Tuyến đường";
  if (lead.external_source === "google_maps" || lead.source?.startsWith("map_")) {
    return "Google Maps";
  }
  if (lead.source === "import_csv") return "Import CSV";
  if (lead.source === "import_excel") return "Import Excel";
  return lead.source || "Thủ công";
}

function isOverdue(value?: string | null) {
  if (!value) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(value).getTime() < today.getTime();
}

function LeadTags({ lead }: { lead: LeadRecord }) {
  if (lead.tags.length === 0) {
    return <span className="text-sm text-text-muted">Chưa có tag</span>;
  }

  const visibleTags = lead.tags.slice(0, 2);
  const moreCount = lead.tags.length - visibleTags.length;

  return (
    <div className="flex flex-wrap gap-2">
      {visibleTags.map((tag) => (
        <Badge key={tag.id} tone="neutral">
          {tag.name}
        </Badge>
      ))}
      {moreCount > 0 ? <Badge tone="outline">+{moreCount}</Badge> : null}
    </div>
  );
}

function LeadRowActions({ lead }: { lead: LeadRecord }) {
  const directionsHref = getGoogleMapsDirectionsUrl({
    address: lead.address,
    googleMapsUrl: lead.google_maps_url,
    latitude: lead.latitude,
    longitude: lead.longitude,
    placeId: lead.place_id,
  });

  return (
    <div className="flex items-center justify-end gap-2">
      {lead.phone ? (
        <a
          className="inline-flex h-10 w-10 items-center justify-center rounded-control border border-border-soft bg-surface text-text-primary transition hover:border-primary/40 hover:text-primary"
          href={`tel:${lead.phone}`}
        >
          <Phone aria-hidden="true" className="h-4 w-4" />
          <span className="sr-only">Gọi {lead.name}</span>
        </a>
      ) : null}
      {directionsHref ? (
        <a
          className="inline-flex h-10 w-10 items-center justify-center rounded-control border border-border-soft bg-surface text-text-primary transition hover:border-primary/40 hover:text-primary"
          href={directionsHref}
          rel="noreferrer"
          target="_blank"
        >
          <Navigation aria-hidden="true" className="h-4 w-4" />
          <span className="sr-only">Chỉ đường tới {lead.name}</span>
        </a>
      ) : null}
      <Link
        className="inline-flex h-10 w-10 items-center justify-center rounded-control border border-border-soft bg-surface text-text-primary transition hover:border-primary/40 hover:text-primary"
        href={`/app/leads/${lead.id}#add-note`}
      >
        <MessageSquarePlus aria-hidden="true" className="h-4 w-4" />
        <span className="sr-only">Thêm ghi chú cho {lead.name}</span>
      </Link>
      <Link
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-primary px-3 py-2 text-sm font-bold text-white shadow-soft transition hover:bg-primary-hover"
        href={`/app/leads/${lead.id}`}
      >
        <ExternalLink aria-hidden="true" className="h-4 w-4" />
        Xem
      </Link>
    </div>
  );
}

function LeadMobileCard({ lead }: { lead: LeadRecord }) {
  const overdue = isOverdue(lead.next_follow_up_at);
  const directionsHref = getGoogleMapsDirectionsUrl({
    address: lead.address,
    googleMapsUrl: lead.google_maps_url,
    latitude: lead.latitude,
    longitude: lead.longitude,
    placeId: lead.place_id,
  });

  return (
    <article className="rounded-card border border-border-soft bg-surface p-4 shadow-card">
      <div className="flex items-start gap-3">
        <label className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-border-soft bg-surface-muted">
          <input
            aria-label={`Chọn ${lead.name}`}
            className="h-5 w-5 accent-primary"
            name="leadIds"
            type="checkbox"
            value={lead.id}
          />
        </label>
        <div className="min-w-0 flex-1">
          <Link
            className="block truncate text-lg font-bold leading-7 text-text-primary hover:text-primary"
            href={`/app/leads/${lead.id}`}
          >
            {lead.name}
          </Link>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-text-secondary">
            {lead.category || lead.address || getSourceLabel(lead)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <LeadStatusBadge status={lead.status} />
        <LeadPriorityBadge priority={lead.priority} />
        {overdue ? <Badge tone="danger">Quá hạn</Badge> : null}
      </div>

      <div className="mt-4 grid gap-3 rounded-control bg-surface-muted p-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold text-text-muted">Follow-up</span>
          <span
            className={[
              "text-right font-bold",
              overdue ? "text-danger" : "text-text-primary",
            ].join(" ")}
          >
            {formatDateTime(lead.next_follow_up_at)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold text-text-muted">Liên hệ gần nhất</span>
          <span className="text-right font-bold text-text-primary">
            {formatDate(lead.last_contacted_at)}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <LeadTags lead={lead} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {lead.phone ? (
          <a
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-3 py-2 text-sm font-bold text-text-primary"
            href={`tel:${lead.phone}`}
          >
            <Phone aria-hidden="true" className="h-4 w-4" />
            Gọi
          </a>
        ) : null}
        {directionsHref ? (
          <a
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-3 py-2 text-sm font-bold text-text-primary"
            href={directionsHref}
            rel="noreferrer"
            target="_blank"
          >
            <MapPinned aria-hidden="true" className="h-4 w-4" />
            Chỉ đường
          </a>
        ) : null}
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-3 py-2 text-sm font-bold text-text-primary"
          href={`/app/leads/${lead.id}#lead-tasks`}
        >
          <CalendarClock aria-hidden="true" className="h-4 w-4" />
          Follow-up
        </Link>
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-3 py-2 text-sm font-bold text-white shadow-soft"
          href={`/app/leads/${lead.id}`}
        >
          <ExternalLink aria-hidden="true" className="h-4 w-4" />
          Xem lead
        </Link>
      </div>
    </article>
  );
}

function useDesktopLayout() {
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setDesktop(media.matches);

    sync();
    media.addEventListener("change", sync);

    return () => media.removeEventListener("change", sync);
  }, []);

  return desktop;
}

function DesktopLeadTable({ leads }: LeadListViewProps) {
  return (
    <div className="overflow-hidden rounded-card border border-border-soft bg-surface shadow-card">
      <table className="min-w-full divide-y divide-border-soft">
        <thead className="bg-surface-muted">
          <tr>
            <th className="w-12 px-4 py-3 text-left">
              <span className="sr-only">Chọn lead</span>
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
              Lead
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
              Trạng thái
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
              Follow-up
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
              Nguồn / tag
            </th>
            <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-soft">
          {leads.map((lead) => {
            const overdue = isOverdue(lead.next_follow_up_at);

            return (
              <tr className="align-top transition hover:bg-surface-muted/70" key={lead.id}>
                <td className="px-4 py-4">
                  <label className="flex h-9 w-9 items-center justify-center rounded-control border border-border-soft bg-surface">
                    <input
                      aria-label={`Chọn ${lead.name}`}
                      className="h-5 w-5 accent-primary"
                      name="leadIds"
                      type="checkbox"
                      value={lead.id}
                    />
                  </label>
                </td>
                <td className="max-w-[320px] px-4 py-4">
                  <Link
                    className="font-bold leading-6 text-text-primary hover:text-primary"
                    href={`/app/leads/${lead.id}`}
                  >
                    {lead.name}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-text-secondary">
                    {lead.address || lead.category || "Chưa có địa chỉ/phân loại"}
                  </p>
                  <p className="mt-2 text-xs font-bold text-text-muted">
                    Tạo ngày {formatDate(lead.created_at)}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <LeadStatusBadge status={lead.status} />
                    <LeadPriorityBadge priority={lead.priority} />
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p
                    className={[
                      "text-sm font-bold",
                      overdue ? "text-danger" : "text-text-primary",
                    ].join(" ")}
                  >
                    {formatDateTime(lead.next_follow_up_at)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-text-muted">
                    Liên hệ: {formatDate(lead.last_contacted_at)}
                  </p>
                </td>
                <td className="max-w-[260px] px-4 py-4">
                  <p className="text-sm font-bold text-text-primary">
                    {getSourceLabel(lead)}
                  </p>
                  <div className="mt-2">
                    <LeadTags lead={lead} />
                  </div>
                </td>
                <td className="px-4 py-4">
                  <LeadRowActions lead={lead} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function LeadListView({ leads }: LeadListViewProps) {
  const desktop = useDesktopLayout();

  if (desktop) {
    return <DesktopLeadTable leads={leads} />;
  }

  return (
    <div className="space-y-3">
      {leads.map((lead) => (
        <LeadMobileCard key={lead.id} lead={lead} />
      ))}
    </div>
  );
}
