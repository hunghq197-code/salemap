import Link from "next/link";

type AdminPaginationProps = {
  basePath: string;
  limit: number;
  page: number;
  params?: Record<string, string | string[] | undefined>;
  totalPages: number;
};

function buildHref(
  basePath: string,
  params: Record<string, string | string[] | undefined> | undefined,
  page: number,
  limit: number,
) {
  const search = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (key === "page" || key === "limit") {
      return;
    }

    const resolved = Array.isArray(value) ? value[0] : value;

    if (resolved) {
      search.set(key, resolved);
    }
  });

  search.set("page", String(page));
  search.set("limit", String(limit));

  return `${basePath}?${search.toString()}`;
}

export function AdminPagination({
  basePath,
  limit,
  page,
  params,
  totalPages,
}: AdminPaginationProps) {
  return (
    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-slate-500">
        Trang {page}/{totalPages}
      </p>
      <div className="flex gap-3">
        <Link
          aria-disabled={page <= 1}
          className={[
            "inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2 text-sm font-bold",
            page <= 1
              ? "pointer-events-none border-slate-200 bg-slate-50 text-slate-400"
              : "border-slate-200 bg-white text-ink hover:border-ocean",
          ].join(" ")}
          href={buildHref(basePath, params, Math.max(1, page - 1), limit)}
        >
          Trước
        </Link>
        <Link
          aria-disabled={page >= totalPages}
          className={[
            "inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2 text-sm font-bold",
            page >= totalPages
              ? "pointer-events-none border-slate-200 bg-slate-50 text-slate-400"
              : "border-slate-200 bg-white text-ink hover:border-ocean",
          ].join(" ")}
          href={buildHref(basePath, params, Math.min(totalPages, page + 1), limit)}
        >
          Sau
        </Link>
      </div>
    </div>
  );
}
