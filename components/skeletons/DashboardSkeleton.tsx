function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl">
      <SkeletonBlock className="h-5 w-32" />
      <SkeletonBlock className="mt-4 h-10 w-80 max-w-full" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock className="h-32" key={index} />
        ))}
      </div>
      <SkeletonBlock className="mt-8 h-44" />
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <SkeletonBlock className="h-52" />
        <SkeletonBlock className="h-52" />
      </div>
    </div>
  );
}
