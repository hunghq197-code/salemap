type PageLoadingSkeletonProps = {
  cards?: number;
};

export function PageLoadingSkeleton({ cards = 3 }: PageLoadingSkeletonProps) {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 h-10 w-72 max-w-full animate-pulse rounded bg-slate-200" />
      <div className="mt-5 h-20 max-w-3xl animate-pulse rounded-lg bg-slate-100" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cards }).map((_, index) => (
          <div
            className="h-32 animate-pulse rounded-lg border border-slate-200 bg-white"
            key={index}
          />
        ))}
      </div>
    </div>
  );
}
