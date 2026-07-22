function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

export function MapSkeleton() {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <SkeletonBlock className="h-5 w-40" />
        <SkeletonBlock className="h-5 w-24" />
      </div>
      <SkeletonBlock className="min-h-[320px] rounded-none bg-slate-100 sm:min-h-[420px] lg:min-h-[620px]" />
    </section>
  );
}

export function DiscoverSkeleton() {
  return (
    <div className="mx-auto max-w-6xl">
      <SkeletonBlock className="h-5 w-36" />
      <SkeletonBlock className="mt-4 h-10 w-96 max-w-full" />
      <div className="mt-6 grid grid-cols-3 gap-2 rounded-lg bg-white p-1 shadow-sm ring-1 ring-slate-200">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonBlock className="h-11" key={index} />
        ))}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="space-y-4">
          <SkeletonBlock className="h-80 bg-white" />
          <SkeletonBlock className="h-28 bg-white" />
          <SkeletonBlock className="h-28 bg-white" />
        </div>
        <MapSkeleton />
      </div>
    </div>
  );
}
