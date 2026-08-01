function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

export function AnalyticsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl">
      <SkeletonBlock className="h-5 w-28" />
      <SkeletonBlock className="mt-4 h-10 w-96 max-w-full" />
      <SkeletonBlock className="mt-6 h-36 bg-white" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonBlock className="h-36 bg-white" key={index} />
        ))}
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonBlock className="h-80 bg-white" key={index} />
        ))}
      </div>
    </div>
  );
}
