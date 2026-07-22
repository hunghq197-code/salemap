import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MergeLeadsForm } from "@/components/cleanup/MergeLeadsForm";
import { LEAD_DUPLICATE_REASONS } from "@/lib/constants/lead-cleanup";
import { getMergeGroupById } from "@/lib/leads/merge-leads";

export const dynamic = "force-dynamic";

type DuplicateGroupDetailPageProps = {
  params: Promise<{
    groupId: string;
  }>;
};

function reasonLabel(reason?: string | null) {
  return reason && reason in LEAD_DUPLICATE_REASONS
    ? LEAD_DUPLICATE_REASONS[reason as keyof typeof LEAD_DUPLICATE_REASONS]
    : "Có khả năng trùng";
}

export default async function DuplicateGroupDetailPage(props: DuplicateGroupDetailPageProps) {
  const params = await props.params;
  const group = await getMergeGroupById(params.groupId);

  if (!group) {
    return (
      <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-ink">Không tìm thấy nhóm lead trùng</h1>
        <Link
          className="mt-5 inline-flex min-h-12 items-center rounded-lg bg-mint px-5 py-3 text-sm font-bold text-ink"
          href="/app/leads/cleanup/duplicates"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-ocean hover:text-ink"
        href="/app/leads/cleanup/duplicates"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Về nhóm lead trùng
      </Link>

      <section className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
          Merge preview
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">
          Xác nhận gộp lead
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
          Hãy chọn lead chính để giữ lại. Các ghi chú và lịch nhắc sẽ được chuyển sang lead
          chính. Lead còn lại sẽ được lưu trữ, không bị xóa vĩnh viễn.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex min-h-8 items-center rounded-full bg-cloud px-3 py-1 text-xs font-bold text-slate-600">
            {reasonLabel(group.duplicate_reason)}
          </span>
          <span className="inline-flex min-h-8 items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
            Confidence {group.confidence_score ?? 0}%
          </span>
          <span className="inline-flex min-h-8 items-center rounded-full bg-mint/15 px-3 py-1 text-xs font-bold text-ocean">
            {group.leads.length} lead trong nhóm
          </span>
        </div>
      </section>

      <div className="mt-5">
        <MergeLeadsForm group={group} />
      </div>
    </div>
  );
}
