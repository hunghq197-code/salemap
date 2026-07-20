type AdminEmptyStateProps = {
  description?: string;
  title?: string;
};

export function AdminEmptyState({
  description = "Chưa có dữ liệu phù hợp với bộ lọc hiện tại.",
  title = "Không có dữ liệu",
}: AdminEmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm">
      <p className="text-base font-bold text-ink">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
