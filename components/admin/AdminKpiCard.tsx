import type { ReactNode } from "react";

type AdminKpiCardProps = {
  description?: string;
  icon?: ReactNode;
  label: string;
  value: number | string;
};

export function AdminKpiCard({ description, icon, label, value }: AdminKpiCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold text-ink">{value}</p>
        </div>
        {icon ? (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ocean/10 text-ocean">
            {icon}
          </span>
        ) : null}
      </div>
      {description ? (
        <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
          {description}
        </p>
      ) : null}
    </article>
  );
}
