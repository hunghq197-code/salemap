import Link from "next/link";
import { Card } from "@/components/ui/Card";

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
    <Card className="p-8 text-center">
      <h2 className="text-xl font-bold text-text-primary">{title}</h2>
      {description ? (
        <p className="mx-auto mt-3 max-w-2xl text-base leading-8 text-text-secondary">
          {description}
        </p>
      ) : null}
      {actionHref && actionLabel ? (
        <Link
          className="mt-5 inline-flex min-h-12 items-center justify-center rounded-control bg-primary px-5 py-3 text-base font-bold text-white shadow-soft transition hover:bg-primary-hover"
          href={actionHref}
        >
          {actionLabel}
        </Link>
      ) : null}
    </Card>
  );
}
