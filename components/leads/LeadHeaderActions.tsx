"use client";

import {
  BarChart3,
  Download,
  FileSpreadsheet,
  MapPinned,
  MoreHorizontal,
  Plus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";

type LeadHeaderActionsProps = {
  analyticsHref?: string;
  cleanupHref?: string;
  createHref: string;
  discoverHref: string;
  exportHref?: string;
  importHref?: string;
  showUtilityActions?: boolean;
};

export function LeadHeaderActions({
  analyticsHref = "/app/analytics",
  cleanupHref = "/app/leads/cleanup",
  createHref,
  discoverHref,
  exportHref = "/app/export",
  importHref = "/app/import",
  showUtilityActions = false,
}: LeadHeaderActionsProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
      <Link
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-primary px-5 py-3 text-base font-bold text-white shadow-soft transition hover:bg-primary-hover"
        href={createHref}
      >
        <Plus aria-hidden="true" className="h-5 w-5" />
        Thêm lead
      </Link>
      <Link
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-4 py-3 text-sm font-bold text-text-primary shadow-sm transition hover:border-primary/40 hover:text-primary"
        href={discoverHref}
        prefetch={false}
      >
        <MapPinned aria-hidden="true" className="h-5 w-5" />
        Tìm khách trên bản đồ
      </Link>
      {importHref ? (
        <Link
          className="hidden min-h-12 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-4 py-3 text-sm font-bold text-text-primary shadow-sm transition hover:border-primary/40 hover:text-primary md:inline-flex"
          href={importHref}
          prefetch={false}
        >
          <FileSpreadsheet aria-hidden="true" className="h-5 w-5" />
          Import dữ liệu
        </Link>
      ) : null}
      {showUtilityActions ? (
        <DropdownMenu
          align="end"
          label="Mở thêm thao tác lead"
          trigger={
            <span className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-4 py-3 text-sm font-bold text-text-primary shadow-sm transition hover:border-primary/40 hover:text-primary">
              <MoreHorizontal aria-hidden="true" className="h-5 w-5" />
              Thêm
            </span>
          }
        >
          {importHref ? (
            <DropdownMenuItem href={importHref}>
              <FileSpreadsheet aria-hidden="true" className="mr-2 h-4 w-4" />
              Import dữ liệu
            </DropdownMenuItem>
          ) : null}
          {exportHref ? (
            <DropdownMenuItem href={exportHref}>
              <Download aria-hidden="true" className="mr-2 h-4 w-4" />
              Xuất dữ liệu
            </DropdownMenuItem>
          ) : null}
          {cleanupHref ? (
            <DropdownMenuItem href={cleanupHref}>
              <Sparkles aria-hidden="true" className="mr-2 h-4 w-4" />
              Dọn dữ liệu
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          {analyticsHref ? (
            <DropdownMenuItem href={analyticsHref}>
              <BarChart3 aria-hidden="true" className="mr-2 h-4 w-4" />
              Xem hiệu suất
            </DropdownMenuItem>
          ) : null}
        </DropdownMenu>
      ) : null}
    </div>
  );
}
