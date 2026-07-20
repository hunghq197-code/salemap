import type { Metadata } from "next";
import { ArrowRight, MessageSquareHeart } from "lucide-react";
import Link from "next/link";
import { BetaStatusTracker } from "@/components/beta/BetaStatusTracker";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Trạng thái SaleMap",
};

const openedFeatures = [
  "Lưu lead cá nhân",
  "Ghi chú lead",
  "Nhắc follow-up",
  "Tìm khách theo khu vực",
  "Tìm khách dọc tuyến",
  "Thư viện mẫu sale",
  "Xuất CSV",
];

const experimentalFeatures = [
  "Email nhắc follow-up",
  "Quota/upgrade interest",
  "Retention survey",
];

const upcomingFeatures = [
  "Tối ưu route search",
  "Import dữ liệu",
  "AI viết tin nhắn",
  "Gói Pro",
];

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-3">
      {items.map((item) => (
        <li
          className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-ink shadow-sm"
          key={item}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function StatusPage() {
  return (
    <>
      <Header />
      <BetaStatusTracker />
      <main className="bg-cloud px-4 py-16 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            Launch status
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-ink sm:text-5xl">
            Trạng thái SaleMap
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            SaleMap đã sẵn sàng sử dụng và đang tiếp tục mở dần một số tính năng mới theo nhóm user để đảm bảo trải nghiệm ổn định.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft transition hover:bg-[#5de0b3]"
              href="/app/dashboard"
            >
              Vào app
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

        <section className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-3">
          <article>
            <h2 className="text-xl font-bold text-ink">Tính năng đã mở</h2>
            <FeatureList items={openedFeatures} />
          </article>
          <article>
            <h2 className="text-xl font-bold text-ink">Tính năng đang thử nghiệm</h2>
            <FeatureList items={experimentalFeatures} />
          </article>
          <article>
            <h2 className="text-xl font-bold text-ink">Tính năng sắp mở</h2>
            <FeatureList items={upcomingFeatures} />
          </article>
        </section>

        <section className="mx-auto mt-10 grid max-w-5xl gap-6 lg:grid-cols-2">
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-ink">Cách gửi lỗi/góp ý</h2>
            <p className="mt-3 text-base leading-8 text-slate-600">
              Khi gặp lỗi, hãy gửi góp ý trong app và mô tả màn hình đang dùng, thao tác vừa làm và kết quả mong muốn.
            </p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-ink">Lưu ý dữ liệu sử dụng</h2>
            <p className="mt-3 text-base leading-8 text-slate-600">
              Dữ liệu sử dụng được dùng để cải thiện sản phẩm. SaleMap sẽ thông báo rõ nếu có thay đổi lớn về dữ liệu hoặc gói sử dụng.
            </p>
          </article>
        </section>
      </main>
      <Footer />
    </>
  );
}
