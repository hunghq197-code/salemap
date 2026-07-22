function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

export function PipelineSkeleton() {
  return (
    <div className="mx-auto max-w-[1600px]">
      <SkeletonBlock className="h-5 w-28" />
      <SkeletonBlock className="mt-4 h-10 w-80 max-w-full" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock className="h-28 bg-white" key={index} />
        ))}
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonBlock className="h-[520px] bg-white" key={index} />
        ))}
      </div>
    </div>
  );
}
