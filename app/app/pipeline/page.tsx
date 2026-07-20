import { BarChart3, Bell, CheckCircle2, UsersRound } from "lucide-react";
import Link from "next/link";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";
import { getPipelineColumnsWithLeads } from "@/lib/data/lead-pipeline";

export const dynamic = "force-dynamic";

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UsersRound;
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-500">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-mint/15 text-ocean">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold text-ink">{value}</p>
    </article>
  );
}

export default async function PipelinePage() {
  const { columns, summary } = await getPipelineColumnsWithLeads({ limitPerColumn: 50 });

  return (
    <div className="mx-auto max-w-[1600px]">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            Pipeline
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Pipeline ban hang
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
            Theo doi lead theo tung trang thai cham soc. MVP nay dung dropdown doi status tren
            tung card de hoat dong tot ca desktop lan mobile.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm hover:border-ocean"
            href="/app/analytics"
          >
            Xem analytics pipeline
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm hover:border-ocean"
            href="/app/leads/views"
          >
            Mo goc nhin lead
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft hover:bg-[#5de0b3]"
            href="/app/leads?create=1"
          >
            Them lead
          </Link>
        </div>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={UsersRound} label="Tong lead dang mo" value={summary.totalActiveLeads} />
        <SummaryCard icon={Bell} label="Can follow-up" value={summary.followUpCount} />
        <SummaryCard icon={CheckCircle2} label="Da chot" value={summary.wonCount} />
        <SummaryCard icon={BarChart3} label="Da mat / khong phu hop" value={summary.lostCount} />
      </section>

      <section className="mt-6">
        <PipelineBoard columns={columns} />
      </section>
    </div>
  );
}
