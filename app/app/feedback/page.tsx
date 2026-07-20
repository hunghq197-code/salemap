import { MessageSquareHeart } from "lucide-react";
import Link from "next/link";
import { BetaFeedbackForm } from "@/components/beta/BetaFeedbackForm";

export const dynamic = "force-dynamic";

export default function FeedbackPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link className="text-sm font-bold text-ocean hover:text-ink" href="/app/dashboard">
        Về dashboard
      </Link>
      <div className="mt-5 flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-mint/15 text-ocean">
          <MessageSquareHeart aria-hidden="true" className="h-6 w-6" />
        </span>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            Feedback
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Góp ý SaleMap
          </h1>
          <p className="mt-3 text-base leading-8 text-slate-600">
            Bạn gặp lỗi, thấy khó dùng hoặc muốn đề xuất tính năng? Hãy gửi góp ý để
            chúng tôi cải thiện SaleMap.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <BetaFeedbackForm />
      </div>
    </div>
  );
}
