export default function AdminRevenueLoading() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-64 animate-pulse rounded-lg bg-slate-200" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div className="h-28 animate-pulse rounded-lg bg-slate-200" key={index} />
        ))}
      </div>
    </div>
  );
}
