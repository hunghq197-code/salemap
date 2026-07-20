export default function ProductAppLoading() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 h-9 w-64 max-w-full animate-pulse rounded bg-slate-200" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div className="h-28 animate-pulse rounded-lg bg-cloud" key={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
