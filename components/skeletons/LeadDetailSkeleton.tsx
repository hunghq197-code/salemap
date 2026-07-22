function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

export function LeadDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl">
      <SkeletonBlock className="h-5 w-28" />
      <SkeletonBlock className="mt-4 h-11 w-80 max-w-full" />
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <SkeletonBlock className="h-80 bg-white" />
        <SkeletonBlock className="h-80 bg-white" />
      </div>
      <SkeletonBlock className="mt-5 h-64 bg-white" />
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <SkeletonBlock className="h-64 bg-white" />
        <SkeletonBlock className="h-64 bg-white" />
      </div>
    </div>
  );
}
