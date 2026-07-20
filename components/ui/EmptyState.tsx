import Link from "next/link";

type EmptyStateProps = {
  actionHref?: string;
  actionLabel?: string;
  description?: string;
  title: string;
};

export function EmptyState({
  actionHref,
  actionLabel,
  description,
  title,
}: EmptyStateProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      {description ? (
        <p className="mx-auto mt-3 max-w-2xl text-base leading-8 text-slate-600">
          {description}
        </p>
      ) : null}
      {actionHref && actionLabel ? (
        <Link
          className="mt-5 inline-flex min-h-12 items-center justify-center rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft transition hover:bg-[#5de0b3]"
          href={actionHref}
        >
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}
