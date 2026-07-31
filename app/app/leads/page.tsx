import Link from "next/link";
import { createLeadAction } from "@/app/app/leads/actions";
import { BulkActionsForm } from "@/components/cleanup/BulkActionsForm";
import { LeadEmptyState } from "@/components/leads/LeadEmptyState";
import {
  LeadFilterBar,
  type LeadFilterValues,
} from "@/components/leads/LeadFilterBar";
import { LeadForm } from "@/components/leads/LeadForm";
import { LeadHeaderActions } from "@/components/leads/LeadHeaderActions";
import { LeadListView } from "@/components/leads/LeadListView";
import { LeadSummaryCards } from "@/components/leads/LeadSummaryCards";
import { FirstRunTip } from "@/components/onboarding/FirstRunTip";
import { CreateSavedViewForm } from "@/components/saved-views/CreateSavedViewForm";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Toast } from "@/components/ui/Toast";
import {
  getFilteredLeadCount,
  getFilteredLeads,
} from "@/lib/data/lead-filtered-list";
import { getTags } from "@/lib/data/tags";
import { deserializeLeadFilters, getLeadFilterSummary } from "@/lib/leads/lead-filters";

export const dynamic = "force-dynamic";

type LeadsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

type SearchParams = NonNullable<LeadsPageProps["searchParams"]>;

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getLeadHref(
  searchParams: SearchParams,
  overrides: Record<string, string | number | null | undefined> = {},
) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (key === "toast") return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item) params.append(key, item);
      });
      return;
    }

    if (value) params.set(key, value);
  });

  Object.entries(overrides).forEach(([key, value]) => {
    params.delete(key);

    if (value !== null && value !== undefined && String(value) !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return `/app/leads${query ? `?${query}` : ""}`;
}

function getActiveFilterCount(values: LeadFilterValues) {
  return [
    values.q,
    values.status,
    values.tagId,
    values.priority,
    values.source,
    values.category,
    values.followUp,
    values.noFollowUp,
    values.staleDays,
    values.hasPhone,
    values.hasEmail,
    values.createdFrom,
    values.createdTo,
    values.dataView !== "active" ? values.dataView : "",
  ].filter(Boolean).length;
}

export default async function LeadsPage(props: LeadsPageProps) {
  const searchParams = (await props.searchParams) ?? {};
  const q = getString(searchParams.q) ?? "";
  const status = getString(searchParams.status) ?? "";
  const tagId = getString(searchParams.tagId) ?? "";
  const sort = getString(searchParams.sort) ?? "newest";
  const priority = getString(searchParams.priority) ?? "";
  const source = getString(searchParams.source) ?? "";
  const category = getString(searchParams.category) ?? "";
  const followUp = getString(searchParams.followUp) ?? "";
  const noFollowUp = getString(searchParams.noFollowUp) ?? "";
  const staleDays = getString(searchParams.staleDays) ?? "";
  const hasPhone = getString(searchParams.hasPhone) ?? "";
  const hasEmail = getString(searchParams.hasEmail) ?? "";
  const createdFrom = getString(searchParams.createdFrom) ?? "";
  const createdTo = getString(searchParams.createdTo) ?? "";
  const dataView = getString(searchParams.dataView) ?? "active";
  const page = Number(getString(searchParams.page) || 1);
  const showCreateForm = getString(searchParams.create) === "1";
  const toastCode = getString(searchParams.toast);
  const filters = deserializeLeadFilters({
    ...searchParams,
    archived: dataView === "archived" ? "1" : undefined,
    deleted: dataView === "deleted" ? "1" : undefined,
    tagIds: tagId || undefined,
  });
  const sortBy =
    sort === "oldest"
      ? "created_at"
      : sort === "next_follow_up"
        ? "next_follow_up_at"
        : "updated_at";
  const sortDirection = sort === "oldest" || sort === "next_follow_up" ? "asc" : "desc";
  const filterValues: LeadFilterValues = {
    category,
    createdFrom,
    createdTo,
    dataView,
    followUp,
    hasEmail,
    hasPhone,
    noFollowUp,
    priority,
    q,
    sort,
    source,
    staleDays,
    status,
    tagId,
  };
  const activeFilterCount = getActiveFilterCount(filterValues);

  const [
    leadResult,
    tags,
    totalLeadCount,
    todayFollowUpCount,
    overdueFollowUpCount,
    interestedLeadCount,
  ] = await Promise.all([
    getFilteredLeads({ filters, limit: 20, page, sortBy, sortDirection }),
    getTags(),
    getFilteredLeadCount({}),
    getFilteredLeadCount({ followUp: "today" }),
    getFilteredLeadCount({ followUp: "overdue" }),
    getFilteredLeadCount({ status: ["interested"] }),
  ]);

  const leads = leadResult.items;
  const filterSummary = getLeadFilterSummary(filters);
  const hasFilters = activeFilterCount > 0;
  const totalPages = Math.max(1, Math.ceil(leadResult.total / leadResult.limit));
  const fromResult =
    leadResult.total === 0 ? 0 : (leadResult.page - 1) * leadResult.limit + 1;
  const toResult = Math.min(leadResult.page * leadResult.limit, leadResult.total);
  const createHref = getLeadHref(searchParams, { create: "1", page: null });
  const closeCreateHref = getLeadHref(searchParams, { create: null, page: null });

  return (
    <div className="mx-auto max-w-7xl">
      <Toast code={toastCode} />

      <PageHeader
        actions={
          <LeadHeaderActions
            createHref={createHref}
            discoverHref="/app/discover"
            importHref="/app/import"
            showUtilityActions={totalLeadCount > 0}
          />
        }
        description={`${totalLeadCount} lead active trong workspace. Đang hiển thị ${leadResult.total} lead phù hợp với bộ lọc hiện tại.`}
        eyebrow="Lead"
        fullBleed
        title="Khách hàng tiềm năng"
      >
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="primary">{leadResult.total} kết quả</Badge>
          {hasFilters ? <Badge tone="warning">Đang lọc</Badge> : null}
          <Badge tone="neutral">{leadResult.limit} lead mỗi trang</Badge>
        </div>
      </PageHeader>

      <LeadSummaryCards
        counts={{
          interested: interestedLeadCount,
          overdue: overdueFollowUpCount,
          today: todayFollowUpCount,
          total: totalLeadCount,
        }}
      />

      <FirstRunTip
        message="Lead mới lưu nên có follow-up ngay trong 24 giờ để tránh bị quên."
        storageKey="salemap:first-run-tip:leads"
      />

      {showCreateForm ? (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-text-primary">Thêm lead</h2>
            <Link
              className="text-sm font-bold text-primary hover:text-text-primary"
              href={closeCreateHref}
            >
              Đóng
            </Link>
          </div>
          <LeadForm
            action={createLeadAction}
            cancelHref={closeCreateHref}
            submitLabel="Lưu lead"
            tags={tags}
            toastCode={toastCode}
          />
        </section>
      ) : null}

      <LeadFilterBar
        activeFilterCount={activeFilterCount}
        filterSummary={filterSummary}
        tags={tags}
        values={filterValues}
      />

      {hasFilters ? (
        <div className="mt-4">
          <CreateSavedViewForm filters={filters} />
        </div>
      ) : null}

      {leads.length > 0 ? (
        <>
          <div className="mt-5 flex flex-col gap-2 text-sm font-semibold text-text-secondary sm:flex-row sm:items-center sm:justify-between">
            <p>
              Hiển thị {fromResult}-{toResult} trên {leadResult.total} lead
            </p>
            <p>
              Trang {leadResult.page}/{totalPages}
            </p>
          </div>
          <BulkActionsForm currentPageLeadIds={leads.map((lead) => lead.id)} tags={tags}>
            <LeadListView leads={leads} />
          </BulkActionsForm>
          <Pagination
            className="mt-6"
            currentPage={leadResult.page}
            getPageHref={(targetPage) =>
              getLeadHref(searchParams, {
                create: null,
                page: targetPage,
              })
            }
            totalPages={totalPages}
          />
        </>
      ) : (
        <LeadEmptyState hasFilters={hasFilters} />
      )}
    </div>
  );
}
