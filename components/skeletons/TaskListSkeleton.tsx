function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

export function TaskListSkeleton() {
  return (
    <div className="mx-auto max-w-6xl">
      <SkeletonBlock className="h-5 w-32" />
      <SkeletonBlock className="mt-4 h-10 w-72 max-w-full" />
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock className="h-24 bg-white" key={index} />
        ))}
      </div>
      <SkeletonBlock className="mt-5 h-14 bg-white" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonBlock className="h-32 bg-white" key={index} />
        ))}
      </div>
    </div>
  );
}
