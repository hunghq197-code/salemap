function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

export function ImportSkeleton() {
  return (
    <div className="mx-auto max-w-6xl">
      <SkeletonBlock className="h-5 w-32" />
      <SkeletonBlock className="mt-4 h-10 w-96 max-w-full" />
      <div className="mt-6 grid gap-2 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonBlock className="h-14 bg-white" key={index} />
        ))}
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <SkeletonBlock className="h-96 bg-white" />
        <div className="space-y-5">
          <SkeletonBlock className="h-72 bg-white" />
          <SkeletonBlock className="h-48 bg-white" />
        </div>
      </div>
      <SkeletonBlock className="mt-8 h-80 bg-white" />
    </div>
  );
}
