type SkeletonProps = {
  className?: string;
};

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={joinClasses(
        "animate-pulse rounded-control bg-slate-200/80",
        className,
      )}
    />
  );
}

export function SkeletonText({ className }: SkeletonProps) {
  return <Skeleton className={joinClasses("h-4 w-full", className)} />;
}
