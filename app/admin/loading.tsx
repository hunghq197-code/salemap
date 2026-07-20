export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            className="h-28 animate-pulse rounded-lg border border-slate-200 bg-white"
            key={index}
          />
        ))}
      </div>
    </div>
  );
}
