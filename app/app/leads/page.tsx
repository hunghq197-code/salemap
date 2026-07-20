import { BarChart3, Download, FileSpreadsheet, Filter, MapPinned, Plus, Search, Sparkles, UsersRound } from "lucide-react";
import Link from "next/link";
import { createLeadAction } from "@/app/app/leads/actions";
import { BulkActionsForm } from "@/components/cleanup/BulkActionsForm";
import { LeadCard } from "@/components/leads/LeadCard";
import { LeadForm } from "@/components/leads/LeadForm";
import { CreateSavedViewForm } from "@/components/saved-views/CreateSavedViewForm";
import { Toast } from "@/components/ui/Toast";
import { LEAD_PRIORITY_OPTIONS } from "@/lib/constants/lead-priority";
import { LEAD_STATUS_OPTIONS } from "@/lib/constants/lead-status";
import { getFilteredLeads } from "@/lib/data/lead-filtered-list";
import { getTags } from "@/lib/data/tags";
import { deserializeLeadFilters, getLeadFilterSummary } from "@/lib/leads/lead-filters";

export const dynamic = "force-dynamic";

type LeadsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LeadsPage(props: LeadsPageProps) {
  const searchParams = await props.searchParams;
  const q = getString(searchParams?.q) ?? "";
  const status = getString(searchParams?.status) ?? "";
  const tagId = getString(searchParams?.tagId) ?? "";
  const sort = getString(searchParams?.sort) ?? "newest";
  const priority = getString(searchParams?.priority) ?? "";
  const source = getString(searchParams?.source) ?? "";
  const category = getString(searchParams?.category) ?? "";
  const followUp = getString(searchParams?.followUp) ?? "";
  const noFollowUp = getString(searchParams?.noFollowUp) ?? "";
  const staleDays = getString(searchParams?.staleDays) ?? "";
  const hasPhone = getString(searchParams?.hasPhone) ?? "";
  const hasEmail = getString(searchParams?.hasEmail) ?? "";
  const createdFrom = getString(searchParams?.createdFrom) ?? "";
  const createdTo = getString(searchParams?.createdTo) ?? "";
  const dataView = getString(searchParams?.dataView) ?? "active";
  const page = Number(getString(searchParams?.page) || 1);
  const showCreateForm = getString(searchParams?.create) === "1";
  const toastCode = getString(searchParams?.toast);
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

  const [leadResult, tags] = await Promise.all([
    getFilteredLeads({ filters, limit: 20, page, sortBy, sortDirection }),
    getTags(),
  ]);

  const leads = leadResult.items;
  const filterSummary = getLeadFilterSummary(filters);
  const hasFilters = Boolean(
    q ||
      status ||
      tagId ||
      priority ||
      source ||
      category ||
      followUp ||
      noFollowUp ||
      staleDays ||
      hasPhone ||
      hasEmail ||
      createdFrom ||
      createdTo ||
      dataView !== "active",
  );
  const totalPages = Math.max(1, Math.ceil(leadResult.total / leadResult.limit));

  return (
    <div className="mx-auto max-w-6xl">
      <Toast code={toastCode} />

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            Lead
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Lead cá nhân
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Lead là danh sách khách tiềm năng của riêng bạn. Bạn có thể thêm thủ công hoặc lưu từ kết quả tìm kiếm bản đồ.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {leadResult.total > 0 ? (
            <>
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm hover:border-ocean"
                href="/app/import"
              >
                <FileSpreadsheet aria-hidden="true" className="h-5 w-5" />
                Import dữ liệu
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm hover:border-ocean"
                href="/app/export"
              >
                <Download aria-hidden="true" className="h-5 w-5" />
                Xuất dữ liệu
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm hover:border-ocean"
                href="/app/leads/cleanup"
              >
                <Sparkles aria-hidden="true" className="h-5 w-5" />
                Dọn dữ liệu
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm hover:border-ocean"
                href="/app/analytics"
              >
                <BarChart3 aria-hidden="true" className="h-5 w-5" />
                Xem hiệu suất
              </Link>
            </>
          ) : null}
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft hover:bg-[#5de0b3]"
            href="/app/leads?create=1"
          >
            <Plus aria-hidden="true" className="h-5 w-5" />
            Thêm lead
          </Link>
        </div>
      </div>

      {showCreateForm ? (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-ink">Thêm lead</h2>
            <Link className="text-sm font-bold text-ocean hover:text-ink" href="/app/leads">
              Đóng
            </Link>
          </div>
          <LeadForm
            action={createLeadAction}
            cancelHref="/app/leads"
            submitLabel="Lưu lead"
            tags={tags}
            toastCode={toastCode}
          />
        </section>
      ) : null}

      <form
        className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        method="get"
      >
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto]">
          <label className="text-sm font-bold text-ink">
            Tìm kiếm
            <div className="relative mt-2">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                className="min-h-12 w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
                defaultValue={q}
                name="q"
                placeholder="Tìm theo tên, số điện thoại, địa chỉ..."
              />
            </div>
          </label>
          <label className="text-sm font-bold text-ink">
            Trạng thái
            <select
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              defaultValue={status}
              name="status"
            >
              <option value="">Tất cả</option>
              {LEAD_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold text-ink">
            Tag
            <select
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              defaultValue={tagId}
              name="tagId"
            >
              <option value="">Tất cả</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold text-ink">
            Sắp xếp
            <select
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              defaultValue={sort}
              name="sort"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="next_follow_up">Follow-up gần nhất</option>
            </select>
          </label>
          <label className="text-sm font-bold text-ink">
            Dữ liệu
            <select
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              defaultValue={dataView}
              name="dataView"
            >
              <option value="active">Đang hoạt động</option>
              <option value="archived">Đã lưu trữ</option>
              <option value="deleted">Đã xóa mềm</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-bold text-white hover:bg-ocean lg:flex-none"
              type="submit"
            >
              <Filter aria-hidden="true" className="h-4 w-4" />
              Lọc
            </button>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-ink hover:border-ocean hover:text-ocean"
              href="/app/leads"
            >
              Xóa
            </Link>
          </div>
        </div>
        <details className="mt-4 rounded-lg border border-slate-200 bg-cloud/50 p-4">
          <summary className="cursor-pointer text-sm font-bold text-ink">
            Bộ lọc nâng cao
          </summary>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm font-bold text-ink">
              Ưu tiên
              <select
                className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean"
                defaultValue={priority}
                name="priority"
              >
                <option value="">Tất cả</option>
                {LEAD_PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-bold text-ink">
              Nguồn lead
              <select
                className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean"
                defaultValue={source}
                name="source"
              >
                <option value="">Tất cả</option>
                <option value="manual">Thủ công</option>
                <option value="import_csv">Import CSV</option>
                <option value="import_excel">Import Excel</option>
                <option value="map_near_me">Bản đồ gần tôi</option>
                <option value="map_area">Bản đồ khu vực</option>
                <option value="route_search">Tuyến đường</option>
              </select>
            </label>
            <label className="text-sm font-bold text-ink">
              Ngành/loại khách
              <input
                className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean"
                defaultValue={category}
                name="category"
                placeholder="nhà thuốc, spa..."
              />
            </label>
            <label className="text-sm font-bold text-ink">
              Follow-up
              <select
                className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean"
                defaultValue={followUp}
                name="followUp"
              >
                <option value="">Tất cả</option>
                <option value="today">Hôm nay</option>
                <option value="overdue">Quá hạn</option>
                <option value="today_or_overdue">Hôm nay hoặc quá hạn</option>
                <option value="this_week">Tuần này</option>
                <option value="future">Tương lai</option>
              </select>
            </label>
            <label className="text-sm font-bold text-ink">
              Từ ngày tạo
              <input
                className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean"
                defaultValue={createdFrom}
                name="createdFrom"
                type="date"
              />
            </label>
            <label className="text-sm font-bold text-ink">
              Đến ngày tạo
              <input
                className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean"
                defaultValue={createdTo}
                name="createdTo"
                type="date"
              />
            </label>
            <label className="text-sm font-bold text-ink">
              Lâu chưa chăm sóc
              <input
                className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean"
                defaultValue={staleDays}
                min={1}
                name="staleDays"
                placeholder="14"
                type="number"
              />
            </label>
            <div className="grid gap-2 text-sm font-bold text-ink">
              <label className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                <input
                  className="h-5 w-5"
                  defaultChecked={hasPhone === "1" || hasPhone === "true"}
                  name="hasPhone"
                  type="checkbox"
                  value="1"
                />
                Có số điện thoại
              </label>
              <label className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                <input
                  className="h-5 w-5"
                  defaultChecked={hasEmail === "1" || hasEmail === "true"}
                  name="hasEmail"
                  type="checkbox"
                  value="1"
                />
                Có email
              </label>
              <label className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                <input
                  className="h-5 w-5"
                  defaultChecked={noFollowUp === "1" || noFollowUp === "true"}
                  name="noFollowUp"
                  type="checkbox"
                  value="1"
                />
                Chưa có lịch hẹn
              </label>
            </div>
          </div>
        </details>
      </form>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-bold text-slate-500">Tóm tắt bộ lọc</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {filterSummary.map((item) => (
              <span
                className="inline-flex min-h-8 items-center rounded-full bg-cloud px-3 py-1 text-xs font-bold text-slate-600"
                key={item}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        <CreateSavedViewForm filters={filters} />
      </div>

      {leads.length > 0 ? (
        <>
          <div className="mt-5 flex flex-col gap-2 text-sm font-semibold text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Hiển thị {leads.length} / {leadResult.total} lead
            </p>
            <p>
              Trang {leadResult.page} / {totalPages}
            </p>
          </div>
          <BulkActionsForm currentPageLeadIds={leads.map((lead) => lead.id)} tags={tags}>
            <div className="space-y-4">
              {leads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} selectable />
              ))}
            </div>
          </BulkActionsForm>
          {totalPages > 1 ? (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {leadResult.page > 1 ? (
                <Link
                  className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink hover:border-ocean"
                  href={`/app/leads?page=${leadResult.page - 1}`}
                >
                  Trang trước
                </Link>
              ) : null}
              {leadResult.page < totalPages ? (
                <Link
                  className="inline-flex min-h-11 items-center rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ocean"
                  href={`/app/leads?page=${leadResult.page + 1}`}
                >
                  Trang sau
                </Link>
              ) : null}
            </div>
          ) : null}
        </>
      ) : (
        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-mint/15 text-ocean">
            <UsersRound aria-hidden="true" className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-ink">
            {hasFilters ? "Chưa có lead phù hợp." : "Bạn chưa có lead nào."}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-8 text-slate-600">
            {hasFilters
              ? "Hãy xóa bộ lọc hiện tại hoặc thử từ khóa khác."
              : "Hãy thêm lead đầu tiên để bắt đầu quản lý khách tiềm năng của bạn."}
          </p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft hover:bg-[#5de0b3]"
              href="/app/leads?create=1"
            >
              <Plus aria-hidden="true" className="h-5 w-5" />
              Thêm lead thủ công
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm hover:border-ocean"
              href="/app/discover"
            >
              <MapPinned aria-hidden="true" className="h-5 w-5" />
              Tìm khách trên bản đồ
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm hover:border-ocean"
              href="/app/import"
            >
              <FileSpreadsheet aria-hidden="true" className="h-5 w-5" />
              Import từ Excel/CSV
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
