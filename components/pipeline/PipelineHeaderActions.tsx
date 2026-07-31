"use client";

import { Filter, MapPinned, MoreHorizontal, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";

export function PipelineHeaderActions() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="hidden flex-col gap-3 sm:flex-row lg:flex">
        <Link
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-5 py-3 text-base font-bold text-text-primary shadow-sm transition hover:border-primary/40 hover:text-primary"
          href="/app/discover"
          prefetch={false}
        >
          <MapPinned aria-hidden="true" className="h-5 w-5" />
          Tìm khách
        </Link>
        <a
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-5 py-3 text-base font-bold text-text-primary shadow-sm transition hover:border-primary/40 hover:text-primary"
          href="#pipeline-filters"
        >
          <Filter aria-hidden="true" className="h-5 w-5" />
          Bộ lọc
        </a>
        <Link
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-primary px-5 py-3 text-base font-bold text-white shadow-soft transition hover:bg-primary-hover"
          href="/app/leads?create=1"
        >
          <Plus aria-hidden="true" className="h-5 w-5" />
          Thêm lead
        </Link>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2 lg:hidden">
        <Link
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-primary px-4 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-primary-hover"
          href="/app/leads?create=1"
        >
          <Plus aria-hidden="true" className="h-5 w-5" />
          Thêm lead
        </Link>
        <button
          aria-expanded={open}
          aria-haspopup="dialog"
          className="inline-flex h-12 w-12 items-center justify-center rounded-control border border-border-soft bg-surface text-text-primary shadow-sm"
          onClick={() => setOpen(true)}
          type="button"
        >
          <MoreHorizontal aria-hidden="true" className="h-5 w-5" />
          <span className="sr-only">Mở hành động pipeline</span>
        </button>
      </div>

      <BottomSheet
        description="Các hành động phụ cho pipeline bán hàng."
        onOpenChange={setOpen}
        open={open}
        title="Pipeline"
      >
        <div className="grid gap-2">
          <Link
            className="flex min-h-12 items-center gap-3 rounded-control px-3 py-2 text-sm font-bold text-text-primary transition hover:bg-primary-soft hover:text-primary"
            href="/app/discover"
            onClick={() => setOpen(false)}
            prefetch={false}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-control bg-surface-muted text-primary">
              <MapPinned aria-hidden="true" className="h-5 w-5" />
            </span>
            Tìm khách
          </Link>
          <a
            className="flex min-h-12 items-center gap-3 rounded-control px-3 py-2 text-sm font-bold text-text-primary transition hover:bg-primary-soft hover:text-primary"
            href="#pipeline-filters"
            onClick={() => setOpen(false)}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-control bg-surface-muted text-primary">
              <Filter aria-hidden="true" className="h-5 w-5" />
            </span>
            Bộ lọc
          </a>
          <Link
            className="flex min-h-12 items-center gap-3 rounded-control px-3 py-2 text-sm font-bold text-text-primary transition hover:bg-primary-soft hover:text-primary"
            href="/app/leads"
            onClick={() => setOpen(false)}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-control bg-surface-muted text-primary">
              <Search aria-hidden="true" className="h-5 w-5" />
            </span>
            Mở danh sách lead
          </Link>
        </div>
      </BottomSheet>
    </>
  );
}
