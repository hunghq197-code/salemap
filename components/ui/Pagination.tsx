import Link from "next/link";

type PaginationProps = {
  className?: string;
  currentPage: number;
  getPageHref: (page: number) => string;
  totalPages: number;
};

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function Pagination({
  className,
  currentPage,
  getPageHref,
  totalPages,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const previousPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  return (
    <nav
      aria-label="Pagination"
      className={joinClasses(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-sm font-semibold text-text-secondary">
        Trang {currentPage}/{totalPages}
      </p>
      <div className="flex gap-2">
        <Link
          aria-disabled={currentPage <= 1}
          className={joinClasses(
            "inline-flex min-h-10 items-center justify-center rounded-control border border-border-soft bg-surface px-4 py-2 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary",
            currentPage <= 1 && "pointer-events-none opacity-50",
          )}
          href={getPageHref(previousPage)}
        >
          Trước
        </Link>
        <Link
          aria-disabled={currentPage >= totalPages}
          className={joinClasses(
            "inline-flex min-h-10 items-center justify-center rounded-control border border-border-soft bg-surface px-4 py-2 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary",
            currentPage >= totalPages && "pointer-events-none opacity-50",
          )}
          href={getPageHref(nextPage)}
        >
          Sau
        </Link>
      </div>
    </nav>
  );
}
