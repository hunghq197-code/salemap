import { ArrowLeft, History } from "lucide-react";
import Link from "next/link";
import { BULK_ACTION_TYPES } from "@/lib/constants/lead-cleanup";
import { getBulkActionJobs } from "@/lib/leads/bulk-actions";

export const dynamic = "force-dynamic";

type BulkActionsHistoryPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export default async function BulkActionsHistoryPage(props: BulkActionsHistoryPageProps) {
  const searchParams = await props.searchParams;
  const page = Number(getString(searchParams?.page) || 1);
  const result = await getBulkActionJobs({ page });

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-ocean hover:text-ink"
        href="/app/leads/cleanup"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Ve trung tam don du lieu
      </Link>

      <div className="mt-4">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
          Bulk actions
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">
          Lich su thao tac hang loat
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
          Theo doi cac lan cap nhat trang thai, tag, uu tien, luu tru hoac xoa mem lead.
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {result.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-cloud text-slate-600">
                <tr>
                  {["Ngay", "Action type", "Total", "Success", "Failed", "Status"].map((header) => (
                    <th className="px-4 py-3 font-bold" key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.items.map((job) => (
                  <tr className="border-t border-slate-100" key={job.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(job.created_at)}</td>
                    <td className="px-4 py-3 font-bold text-ink">
                      {BULK_ACTION_TYPES[job.action_type as keyof typeof BULK_ACTION_TYPES] || job.action_type}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{job.total_count ?? 0}</td>
                    <td className="px-4 py-3 text-emerald-700">{job.success_count ?? 0}</td>
                    <td className="px-4 py-3 text-rose-700">{job.failed_count ?? 0}</td>
                    <td className="px-4 py-3 text-slate-700">{job.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <section className="p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-mint/15 text-ocean">
              <History aria-hidden="true" className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-ink">Chua co bulk action nao.</h2>
          </section>
        )}
      </div>
    </div>
  );
}
