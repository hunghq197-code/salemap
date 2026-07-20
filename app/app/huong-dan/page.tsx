import { ArrowRight, CheckCircle2, MessageSquareHeart, PlayCircle } from "lucide-react";
import Link from "next/link";
import { BetaGuideTracker } from "@/components/beta/BetaGuideTracker";

const quickTestSteps = [
  "Thêm một lead thủ công",
  "Thêm ghi chú cho lead đó",
  "Tạo follow-up vào ngày mai",
  "Tìm thử khách theo khu vực",
  "Tìm thử khách dọc tuyến",
  "Lưu một địa điểm thành lead",
  "Gửi góp ý",
];

const feedbackQuestions = [
  "Bạn có hiểu sản phẩm dùng để làm gì không?",
  "Bạn có thấy thao tác nào khó không?",
  "Bạn có gặp lỗi khi tìm khách hoặc lưu lead không?",
  "Bạn có thấy tính năng route search hữu ích không?",
  "Bạn có dùng app này hằng ngày không?",
  "Điều gì khiến bạn bỏ dùng?",
];

export const dynamic = "force-dynamic";

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-5xl">
      <BetaGuideTracker />
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
          SaleMap
        </p>
        <h1 className="mt-2 max-w-3xl text-3xl font-bold leading-tight text-ink sm:text-4xl">
          Hướng dẫn dùng SaleMap
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
          SaleMap giúp bạn tìm khách tiềm năng, lưu lead cá nhân, ghi chú sau mỗi
          lần liên hệ và nhắc follow-up đúng ngày.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft transition hover:bg-[#5de0b3]"
            href="/app/dashboard"
          >
            Bắt đầu ngay
            <ArrowRight aria-hidden="true" className="h-5 w-5" />
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm transition hover:border-ocean"
            href="/app/feedback"
          >
            <MessageSquareHeart aria-hidden="true" className="h-5 w-5" />
            Gửi góp ý
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.15fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ocean/10 text-ocean">
              <PlayCircle aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-ink">Luồng nên test đầu tiên</h2>
              <p className="mt-2 text-base leading-8 text-slate-600">
                Tìm khách → Lưu lead → Thêm ghi chú → Tạo follow-up → Xem việc hôm nay
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-ink">Cách test nhanh trong 10 phút</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {quickTestSteps.map((step, index) => (
              <div className="flex gap-3 rounded-lg bg-cloud px-4 py-3" key={step}>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-bold text-ocean">
                  {index + 1}
                </span>
                <p className="text-sm font-semibold leading-6 text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-ink">Những gì chúng tôi cần bạn góp ý</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {feedbackQuestions.map((question) => (
            <div className="flex gap-3 rounded-lg bg-cloud px-4 py-3" key={question}>
              <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 flex-none text-ocean" />
              <p className="text-sm font-semibold leading-6 text-slate-700">{question}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5 text-base leading-8 text-amber-900">
        <h2 className="text-xl font-bold">Lưu ý khi sử dụng</h2>
        <p className="mt-2">
          SaleMap sẽ tiếp tục được cải thiện. Một số tính năng có thể được mở
          rộng hoặc điều chỉnh để phù hợp hơn với quy trình bán hàng thực tế.
        </p>
      </section>
    </div>
  );
}
