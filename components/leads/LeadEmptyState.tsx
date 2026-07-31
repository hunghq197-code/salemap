import { FileSpreadsheet, MapPinned, Plus, UsersRound } from "lucide-react";
import Link from "next/link";

type LeadEmptyStateProps = {
  hasFilters: boolean;
};

export function LeadEmptyState({ hasFilters }: LeadEmptyStateProps) {
  return (
    <section className="mt-6 rounded-card border border-border-soft bg-surface p-6 text-center shadow-card">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-control bg-primary-soft text-primary">
        <UsersRound aria-hidden="true" className="h-7 w-7" />
      </div>
      <h2 className="mt-5 text-xl font-bold text-text-primary">
        {hasFilters ? "Chưa có lead phù hợp." : "Bạn chưa có lead nào"}
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-base leading-8 text-text-secondary">
        {hasFilters
          ? "Hãy xóa bộ lọc hiện tại hoặc thử từ khóa khác."
          : "Hãy tìm khách trên bản đồ, import dữ liệu cũ hoặc thêm lead thủ công để bắt đầu quản lý."}
      </p>
      <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-primary px-5 py-3 text-base font-bold text-white shadow-soft hover:bg-primary-hover"
          href="/app/discover"
          prefetch={false}
        >
          <MapPinned aria-hidden="true" className="h-5 w-5" />
          Tìm khách trên bản đồ
        </Link>
        <Link
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-5 py-3 text-base font-bold text-text-primary shadow-sm hover:border-primary/40 hover:text-primary"
          href="/app/import"
          prefetch={false}
        >
          <FileSpreadsheet aria-hidden="true" className="h-5 w-5" />
          Import lead
        </Link>
        <Link
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-5 py-3 text-base font-bold text-text-primary shadow-sm hover:border-primary/40 hover:text-primary"
          href="/app/leads?create=1"
        >
          <Plus aria-hidden="true" className="h-5 w-5" />
          Thêm thủ công
        </Link>
      </div>
    </section>
  );
}
