function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

export function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-5xl">
      <SkeletonBlock className="h-5 w-28" />
      <SkeletonBlock className="mt-4 h-10 w-72 max-w-full" />
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock className="h-64 bg-white" key={index} />
        ))}
      </div>
    </div>
  );
}
