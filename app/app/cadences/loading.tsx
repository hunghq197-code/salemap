function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-control bg-slate-200/80 ${className}`} />;
}

export default function CadencesLoading() {
  return (
    <div className="mx-auto max-w-7xl">
      <SkeletonBlock className="h-4 w-40" />
      <SkeletonBlock className="mt-3 h-10 w-80 max-w-full" />
      <SkeletonBlock className="mt-3 h-6 w-[560px] max-w-full" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <SkeletonBlock className="h-[154px] bg-white" key={item} />
        ))}
      </div>
      <SkeletonBlock className="mt-6 h-12 bg-white" />
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <SkeletonBlock className="h-72 bg-white" key={item} />
        ))}
      </div>
    </div>
  );
}
