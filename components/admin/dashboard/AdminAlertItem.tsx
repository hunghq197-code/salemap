import Link from "next/link";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";

export type AdminAlertSeverity = "critical" | "info" | "warning";

export type AdminAlertItemData = {
  ctaHref?: string;
  ctaLabel?: string;
  description: string;
  severity: AdminAlertSeverity;
  source: string;
  status: string;
  time?: string | null;
  title: string;
};

function severityTone(severity: AdminAlertSeverity) {
  if (severity === "critical") return "red";
  if (severity === "warning") return "yellow";

  return "blue";
}

function formatDate(value?: string | null) {
  if (!value) return "No timestamp";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AdminAlertItem({ item }: { item: AdminAlertItemData }) {
  return (
    <li className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <AdminStatusBadge tone={severityTone(item.severity)} value={item.severity} />
            <AdminStatusBadge value={item.status} />
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              {item.source}
            </span>
          </div>
          <h3 className="mt-3 text-base font-bold text-ink">{item.title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">{formatDate(item.time)}</p>
        </div>
        {item.ctaHref ? (
          <Link
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-ink hover:border-ocean"
            href={item.ctaHref}
          >
            {item.ctaLabel || "Open"}
          </Link>
        ) : null}
      </div>
    </li>
  );
}
