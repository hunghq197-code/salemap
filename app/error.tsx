"use client";

import Link from "next/link";
import { ErrorState } from "@/components/ui/ErrorState";

type RootErrorProps = {
  reset: () => void;
};

export default function RootError({ reset }: RootErrorProps) {
  return (
    <main className="min-h-screen bg-cloud px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <ErrorState
          description="Vui lòng tải lại trang hoặc gửi góp ý để chúng tôi kiểm tra."
          onRetry={reset}
          retryLabel="Tải lại trang"
          title="Đã có lỗi xảy ra."
        />
        <div className="mt-4 text-center">
          <Link className="text-sm font-bold text-ocean hover:text-ink" href="/app/feedback">
            Gửi góp ý
          </Link>
        </div>
      </div>
    </main>
  );
}
