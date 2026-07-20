import { ArrowLeft, MapPinned } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="bg-cloud px-4 py-20 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-soft sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-mint/20 text-ocean">
            <MapPinned aria-hidden="true" className="h-9 w-9" />
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            404
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-ink sm:text-5xl">
            Không tìm thấy trang
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            Trang bạn đang tìm có thể đã được di chuyển hoặc không còn tồn tại.
          </p>
          <div className="mt-8">
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-sm font-semibold text-ink shadow-soft transition hover:bg-[#5de0b3] focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2"
              href="/"
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
