function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

export function LeadListSkeleton() {
  return (
    <div className="mx-auto max-w-6xl">
      <SkeletonBlock className="h-5 w-24" />
      <SkeletonBlock className="mt-4 h-10 w-72 max-w-full" />
      <SkeletonBlock className="mt-6 h-36 bg-white" />
      <div className="mt-5 space-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonBlock className="h-36 bg-white" key={index} />
        ))}
      </div>
    </div>
  );
}
