import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  TrendingDown,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";
import {
  PipelineFilterBar,
  type PipelineFilterValues,
} from "@/components/pipeline/PipelineFilterBar";
import { PipelineHeaderActions } from "@/components/pipeline/PipelineHeaderActions";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { LEAD_STATUS_OPTIONS } from "@/lib/constants/lead-status";
import {
  getPipelineColumnsWithLeads,
  type PipelineCadenceFilter,
  type PipelineSort,
} from "@/lib/data/lead-pipeline";
import { getTags } from "@/lib/data/tags";
import { deserializeLeadFilters } from "@/lib/leads/lead-filters";

export const dynamic = "force-dynamic";

type PipelinePageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const followUpValues = ["future", "overdue", "this_week", "today", "today_or_overdue"] as const;
const cadenceValues = ["active", "none", "paused"] as const;
const sortValues = ["follow_up", "name", "position", "updated"] as const;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getSafeEnum<T extends readonly string[]>(
  value: string | undefined,
  allowed: T,
  fallback = "",
) {
  return value && allowed.includes(value) ? value : fallback;
}

function getSafeSource(value?: string) {
  const clean = value?.trim() ?? "";

  return /^[a-z0-9_-]{1,48}$/i.test(clean) ? clean : "";
}

function getActiveFilterCount(values: PipelineFilterValues) {
  return [
    values.stage,
    values.source,
    values.followUp,
    values.cadence,
    values.tagId,
    values.sort !== "position" ? values.sort : "",
  ].filter(Boolean).length;
}

function buildSubtitle(summary: Awaited<ReturnType<typeof getPipelineColumnsWithLeads>>["summary"]) {
  const parts = [
    `${summary.totalActiveLeads} lead đang mở`,
    `${summary.followUpCount} lead ở stage hẹn lại`,
  ];

  if (summary.overdueFollowUpCount > 0) {
    parts.push(`${summary.overdueFollowUpCount} follow-up quá hạn`);
  }

  return `${parts.join(" · ")}. Dữ liệu lấy từ pipeline hiện tại, không dùng giá trị doanh thu giả.`;
}

export default async function PipelinePage(props: PipelinePageProps) {
  const searchParams = (await props.searchParams) ?? {};
  const stage = getSafeEnum(
    getString(searchParams.stage),
    LEAD_STATUS_OPTIONS.map((status) => status.value),
  );
  const source = getSafeSource(getString(searchParams.source));
  const followUp = getSafeEnum(getString(searchParams.followUp), followUpValues);
  const cadence = getSafeEnum(getString(searchParams.cadence), cadenceValues);
  const tagId = uuidPattern.test(getString(searchParams.tagId) ?? "")
    ? (getString(searchParams.tagId) ?? "")
    : "";
  const sort = getSafeEnum(getString(searchParams.sort), sortValues, "position") as PipelineSort;
  const filterValues: PipelineFilterValues = {
    cadence,
    followUp,
    sort,
    source,
    stage,
    tagId,
  };
  const filters = deserializeLeadFilters({
    followUp: followUp || undefined,
    source: source || undefined,
    tagIds: tagId || undefined,
  });
  const activeFilterCount = getActiveFilterCount(filterValues);
  const [{ columns, summary }, tags] = await Promise.all([
    getPipelineColumnsWithLeads({
      cadenceFilter: (cadence || undefined) as PipelineCadenceFilter | undefined,
      filters,
      limitPerColumn: 40,
      sort,
    }),
    getTags(),
  ]);

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader
        actions={<PipelineHeaderActions />}
        description={buildSubtitle(summary)}
        eyebrow="Pipeline"
        fullBleed
        title="Pipeline bán hàng"
      >
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="primary">{summary.visibleLeadCount} lead trong pipeline</Badge>
          {summary.overdueFollowUpCount > 0 ? (
            <Badge tone="danger">{summary.overdueFollowUpCount} quá hạn</Badge>
          ) : null}
          {activeFilterCount > 0 ? <Badge tone="warning">Đang lọc</Badge> : null}
        </div>
      </PageHeader>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <StatCard
          description="Không tính lead đã chốt, đã mất hoặc không phù hợp."
          icon={UsersRound}
          label="Lead đang mở"
          tone="primary"
          value={summary.totalActiveLeads}
        />
        <StatCard
          description="Lead đang ở stage hẹn lại."
          icon={Bell}
          label="Cần follow-up"
          tone="warning"
          value={summary.followUpCount}
        />
        <StatCard
          description="Follow-up đã qua hạn trong các stage đang mở."
          icon={AlertTriangle}
          label="Quá hạn"
          tone="danger"
          value={summary.overdueFollowUpCount}
        />
        <StatCard
          description="Lead đã chuyển sang kết quả thành công."
          icon={CheckCircle2}
          label="Đã chốt"
          tone="success"
          value={summary.wonCount}
        />
        <StatCard
          description="Bao gồm đã mất và không phù hợp."
          icon={TrendingDown}
          label="Mất / không phù hợp"
          tone="neutral"
          value={summary.lostCount}
        />
      </section>

      <PipelineFilterBar
        activeFilterCount={activeFilterCount}
        tags={tags}
        values={filterValues}
      />

      <section className="mt-6">
        {summary.visibleLeadCount === 0 ? (
          <div className="rounded-card border border-dashed border-border-soft bg-surface p-6 text-center shadow-card sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-control bg-primary-soft text-primary">
              <UsersRound aria-hidden="true" className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-text-primary">
              Chưa có lead phù hợp trong pipeline
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-8 text-text-secondary">
              Hãy thêm lead mới hoặc bỏ bớt bộ lọc để xem các stage đang có dữ liệu.
            </p>
            <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-control bg-primary px-5 py-3 text-base font-bold text-white shadow-soft transition hover:bg-primary-hover"
                href="/app/leads?create=1"
              >
                Thêm lead
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-control border border-border-soft bg-surface px-5 py-3 text-base font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
                href="/app/pipeline"
              >
                Xóa bộ lọc
              </Link>
            </div>
          </div>
        ) : (
          <PipelineBoard columns={columns} key={stage || "all"} selectedStage={stage} />
        )}
      </section>
    </div>
  );
}
