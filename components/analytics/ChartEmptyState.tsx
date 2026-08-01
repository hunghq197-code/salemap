type ChartEmptyStateProps = {
  actionHref?: string;
  actionLabel?: string;
  message: string;
  title: string;
};

export function ChartEmptyState({
  actionHref,
  actionLabel,
  message,
  title,
}: ChartEmptyStateProps) {
  return (
    <div className="rounded-control border border-dashed border-border-strong bg-surface-muted p-5">
      <h3 className="text-base font-bold text-text-primary">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{message}</p>
      {actionHref && actionLabel ? (
        <a
          className="mt-4 inline-flex min-h-10 items-center justify-center rounded-control bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-primary-hover"
          href={actionHref}
        >
          {actionLabel}
        </a>
      ) : null}
    </div>
  );
}
