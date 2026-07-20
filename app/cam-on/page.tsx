import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { ThankYouTracker } from "@/components/analytics/ThankYouTracker";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export default function ThankYouPage() {
  return (
    <>
      <ThankYouTracker />
      <Header />
      <main className="bg-cloud px-4 py-20 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-soft sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-mint/20 text-mint">
            <CheckCircle2 aria-hidden="true" className="h-9 w-9" />
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            Đã nhận đăng ký
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-ink sm:text-5xl">
            Cảm ơn bạn đã đăng ký!
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            Chúng tôi đã nhận thông tin và sẽ liên hệ hỗ trợ bạn bắt đầu dùng SaleMap.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-600">
            Trong vài ngày tới, chúng tôi có thể liên hệ bạn qua
            Zalo/điện thoại/email để hỏi thêm về cách bạn đang tìm khách, lưu
            lead và follow-up hiện nay.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-ocean hover:text-ocean focus:outline-none focus:ring-2 focus:ring-ocean focus:ring-offset-2"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Quay lại trang chủ
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
