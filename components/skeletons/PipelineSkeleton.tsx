function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-control bg-slate-200/80 ${className}`} />;
}

export function PipelineSkeleton() {
  return (
    <div className="mx-auto max-w-[1600px]">
      <SkeletonBlock className="h-4 w-28" />
      <SkeletonBlock className="mt-4 h-10 w-80 max-w-full" />
      <SkeletonBlock className="mt-3 h-6 w-[520px] max-w-full" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonBlock className="h-[154px] bg-white" key={index} />
        ))}
      </div>
      <SkeletonBlock className="mt-6 h-14 bg-white" />
      <div className="mt-6 lg:hidden">
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock className="h-11 w-28 shrink-0 bg-white" key={index} />
          ))}
        </div>
        <div className="mt-4 grid gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock className="h-48 bg-white" key={index} />
          ))}
        </div>
      </div>
      <div className="mt-6 hidden gap-4 overflow-hidden rounded-card border border-border-soft bg-background-subtle p-3 lg:flex">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonBlock className="h-[560px] w-[304px] shrink-0 bg-white" key={index} />
        ))}
      </div>
    </div>
  );
}
