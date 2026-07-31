function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-control bg-surface-muted ${className}`} />;
}

export function MapSkeleton() {
  return (
    <section className="overflow-hidden rounded-shell border border-border-soft bg-surface shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-border-soft px-4 py-3">
        <SkeletonBlock className="h-5 w-40" />
        <SkeletonBlock className="h-5 w-24" />
      </div>
      <SkeletonBlock className="min-h-[440px] rounded-none bg-background-subtle sm:min-h-[560px] lg:min-h-[calc(100vh-150px)]" />
    </section>
  );
}

export function DiscoverSkeleton() {
  return (
    <div className="mx-auto max-w-[1600px]">
      <SkeletonBlock className="h-5 w-36" />
      <SkeletonBlock className="mt-4 h-10 w-96 max-w-full" />
      <div className="mt-6 grid grid-cols-3 gap-1 rounded-card border border-border-soft bg-surface p-1.5 shadow-card">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonBlock className="h-11" key={index} />
        ))}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(360px,420px)_minmax(0,1fr)]">
        <div className="space-y-4">
          <SkeletonBlock className="h-80 bg-surface" />
          <SkeletonBlock className="h-28 bg-surface" />
          <SkeletonBlock className="h-28 bg-surface" />
        </div>
        <MapSkeleton />
      </div>
    </div>
  );
}
