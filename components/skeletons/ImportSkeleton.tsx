function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

export function ImportSkeleton() {
  return (
    <div className="mx-auto max-w-6xl">
      <SkeletonBlock className="h-5 w-32" />
      <SkeletonBlock className="mt-4 h-10 w-96 max-w-full" />
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <SkeletonBlock className="h-80 bg-white" />
        <SkeletonBlock className="h-80 bg-white" />
      </div>
      <SkeletonBlock className="mt-8 h-72 bg-white" />
    </div>
  );
}
