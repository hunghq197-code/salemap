import {
  AlertTriangle,
  Archive,
  History,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { CleanupPageTracker } from "@/components/cleanup/CleanupPageTracker";
import { CleanupScanButtons } from "@/components/cleanup/CleanupScanButtons";
import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import type { QueryLike } from "@/lib/leads/lead-filters";

export const dynamic = "force-dynamic";

async function getCleanupOverview() {
  const { supabase, userId } = await createAuthedSupabaseServerClient();

  async function countQuery(
    table: string,
    apply?: (query: QueryLike) => QueryLike,
  ) {
    let query = supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId) as unknown as QueryLike;

    if (apply) {
      query = apply(query);
    }

    const { count, error } = await query;

    if (error) {
      if (error.code === "42P01" || error.code === "42703") {
        return 0;
      }

      throw new Error(error.message);
    }

    return count ?? 0;
  }

  const [
    duplicateGroups,
    missingInfo,
    invalidData,
    staleLeads,
    bulkJobs,
  ] = await Promise.all([
    countQuery("lead_merge_groups", (query) => query.in("status", ["suggested", "reviewed"])),
    countQuery("lead_data_quality_issues", (query) =>
      query
        .eq("status", "open")
        .in("issue_type", ["missing_phone", "missing_email", "missing_address", "missing_category", "missing_status", "missing_follow_up"]),
    ),
    countQuery("lead_data_quality_issues", (query) =>
      query
        .eq("status", "open")
        .in("issue_type", ["invalid_phone", "invalid_email", "invalid_website"]),
    ),
    countQuery("lead_data_quality_issues", (query) =>
      query.eq("status", "open").eq("issue_type", "stale_lead"),
    ),
    countQuery("bulk_action_jobs"),
  ]);

  return {
    bulkJobs,
    duplicateGroups,
    invalidData,
    missingInfo,
    staleLeads,
  };
}

const cards = [
  {
    description: "Các nhóm SaleMap nhận thấy có thể là cùng một khách hàng.",
    href: "/app/leads/cleanup/duplicates",
    icon: Sparkles,
    key: "duplicateGroups",
    label: "Lead có khả năng trùng",
  },
  {
    description: "Lead thiếu số điện thoại, email, địa chỉ, ngành hoặc follow-up.",
    href: "/app/leads/cleanup/quality?status=open",
    icon: AlertTriangle,
    key: "missingInfo",
    label: "Lead thiếu thông tin",
  },
  {
    description: "Số điện thoại, email hoặc website cần xem lại định dạng.",
    href: "/app/leads/cleanup/quality?status=open",
    icon: ShieldCheck,
    key: "invalidData",
    label: "Dữ liệu sai định dạng",
  },
  {
    description: "Lead đang mở nhưng đã lâu chưa được chăm sóc.",
    href: "/app/leads/cleanup/quality?type=stale_lead&status=open",
    icon: RefreshCw,
    key: "staleLeads",
    label: "Lead lâu chưa chăm sóc",
  },
  {
    description: "Theo dõi các thao tác cập nhật hàng loạt.",
    href: "/app/leads/bulk-actions",
    icon: History,
    key: "bulkJobs",
    label: "Lịch sử thao tác hàng loạt",
  },
] as const;

export default async function LeadCleanupPage() {
  const overview = await getCleanupOverview();

  return (
    <div className="mx-auto max-w-6xl">
      <CleanupPageTracker />
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            Data cleanup
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Dọn dữ liệu lead
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
            Phát hiện lead trùng, thiếu thông tin và thao tác hàng loạt để danh sách khách hàng
            của bạn gọn hơn.
          </p>
        </div>
        <Link
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm hover:border-ocean"
          href="/app/leads"
        >
          <Archive aria-hidden="true" className="h-5 w-5" />
          Về danh sách lead
        </Link>
      </div>

      <div className="mt-6">
        <CleanupScanButtons />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-ocean"
              href={card.href}
              key={card.key}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-mint/15 text-ocean">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <p className="mt-4 text-3xl font-bold text-ink">{overview[card.key]}</p>
              <h2 className="mt-2 text-base font-bold text-ink">{card.label}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
            </Link>
          );
        })}
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-ink">Cách SaleMap dọn dữ liệu an toàn</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            "Không tự động sửa nếu bạn chưa xác nhận.",
            "Gộp lead có bản xem trước và cho phép chọn trường cần giữ.",
            "Lead được gộp chỉ được lưu trữ, không bị xóa vĩnh viễn.",
          ].map((item) => (
            <div className="rounded-lg bg-cloud px-4 py-3 text-sm font-semibold leading-6 text-slate-700" key={item}>
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
