"use client";

import { LocateFixed, List, Maximize2, RotateCw } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { Tooltip } from "@/components/ui/Tooltip";

type MapToolbarProps = {
  canRecenter?: boolean;
  onFitResults?: () => void;
  onRecenter?: () => void;
  onSearchThisArea?: () => void;
  onShowList?: () => void;
  searchThisAreaLoading?: boolean;
  searchThisAreaVisible?: boolean;
};

export function MapToolbar({
  canRecenter = false,
  onFitResults,
  onRecenter,
  onSearchThisArea,
  onShowList,
  searchThisAreaLoading = false,
  searchThisAreaVisible = false,
}: MapToolbarProps) {
  return (
    <div className="pointer-events-none absolute left-3 right-3 top-3 z-10 flex flex-wrap items-start justify-between gap-2 sm:left-4 sm:right-4 sm:top-4">
      <div className="pointer-events-auto flex gap-2 rounded-card border border-border-soft bg-surface/95 p-1.5 shadow-floating">
        <Tooltip content="Về vị trí hiện tại" side="bottom">
          <IconButton
            disabled={!canRecenter}
            icon={<LocateFixed aria-hidden="true" className="h-4 w-4" />}
            label="Về vị trí hiện tại"
            onClick={onRecenter}
            size="sm"
            variant="ghost"
          />
        </Tooltip>
        <Tooltip content="Fit toàn bộ kết quả" side="bottom">
          <IconButton
            icon={<Maximize2 aria-hidden="true" className="h-4 w-4" />}
            label="Fit toàn bộ kết quả"
            onClick={onFitResults}
            size="sm"
            variant="ghost"
          />
        </Tooltip>
        {onShowList ? (
          <Tooltip content="Xem danh sách" side="bottom">
            <IconButton
              className="lg:hidden"
              icon={<List aria-hidden="true" className="h-4 w-4" />}
              label="Xem danh sách"
              onClick={onShowList}
              size="sm"
              variant="ghost"
            />
          </Tooltip>
        ) : null}
      </div>

      {searchThisAreaVisible && onSearchThisArea ? (
        <button
          className="pointer-events-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-primary px-4 py-2 text-sm font-bold text-white shadow-floating transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
          disabled={searchThisAreaLoading}
          onClick={onSearchThisArea}
          type="button"
        >
          <RotateCw
            aria-hidden="true"
            className={searchThisAreaLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"}
          />
          {searchThisAreaLoading ? "Đang tìm..." : "Tìm lại khu vực này"}
        </button>
      ) : null}
    </div>
  );
}
