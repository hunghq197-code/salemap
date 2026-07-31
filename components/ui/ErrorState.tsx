"use client";

import { RefreshCcw } from "lucide-react";
import { Card } from "@/components/ui/Card";

type ErrorStateProps = {
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  title?: string;
};

export function ErrorState({
  description = "Không thể tải dữ liệu. Vui lòng thử lại.",
  onRetry,
  retryLabel = "Thử lại",
  title = "Đã có lỗi xảy ra.",
}: ErrorStateProps) {
  return (
    <Card className="border-danger/20 p-8 text-center">
      <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-base leading-8 text-text-secondary">
        {description}
      </p>
      {onRetry ? (
        <button
          className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-primary px-5 py-3 text-base font-bold text-white transition hover:bg-primary-hover"
          onClick={onRetry}
          type="button"
        >
          <RefreshCcw aria-hidden="true" className="h-5 w-5" />
          {retryLabel}
        </button>
      ) : null}
    </Card>
  );
}
