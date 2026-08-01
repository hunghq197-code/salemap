type ChartErrorStateProps = {
  message?: string;
};

export function ChartErrorState({
  message = "Không thể tải phần dữ liệu này.",
}: ChartErrorStateProps) {
  return (
    <div
      className="rounded-control border border-danger/20 bg-danger-soft p-5 text-sm font-semibold leading-6 text-danger"
      role="status"
    >
      {message}
    </div>
  );
}
