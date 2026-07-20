import { Chrome, Download, MonitorDown, PlusSquare, Share2, Smartphone } from "lucide-react";
import Link from "next/link";
import { InstallGuideTracker } from "@/components/pwa/InstallGuideTracker";

const installSteps = [
  {
    description: "Mở SaleMap bằng Chrome, bấm biểu tượng menu và chọn cài ứng dụng.",
    icon: Chrome,
    title: "Android",
  },
  {
    description: "Mở bằng Safari, bấm Chia sẻ, sau đó chọn Thêm vào màn hình chính.",
    icon: Share2,
    title: "iPhone",
  },
  {
    description: "Mở bằng Chrome hoặc Edge, bấm biểu tượng cài app ở thanh địa chỉ.",
    icon: MonitorDown,
    title: "Desktop",
  },
] as const;

export default function InstallPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <InstallGuideTracker />

      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
        PWA
      </p>
      <div className="mt-2 grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <section>
          <h1 className="text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Cài SaleMap như app trên điện thoại
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-8 text-slate-600">
            Sau khi cài, bạn có thể mở SaleMap nhanh từ màn hình chính, giữ app shell khi mạng
            yếu và tiếp tục nhập ghi chú mà không sợ mất nội dung.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft transition hover:bg-[#5de0b3]"
              href="/app/dashboard"
            >
              <Smartphone aria-hidden="true" className="h-5 w-5" />
              Quay lại dashboard
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm transition hover:border-ocean"
              href="/app/offline"
            >
              <Download aria-hidden="true" className="h-5 w-5" />
              Xem dữ liệu offline
            </Link>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-ink text-white">
              <PlusSquare aria-hidden="true" className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-ink">Mở nhanh ngoài thị trường</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Ghi chú, follow-up và danh sách lead gần đây dễ truy cập hơn khi di chuyển.
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {installSteps.map((step) => {
          const Icon = step.icon;

          return (
            <article
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              key={step.title}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-mint/15 text-ocean">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-xl font-bold text-ink">{step.title}</h2>
              <p className="mt-2 text-base leading-7 text-slate-600">{step.description}</p>
            </article>
          );
        })}
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-cloud p-5">
        <h2 className="text-lg font-bold text-ink">Khi mạng yếu</h2>
        <p className="mt-2 text-base leading-8 text-slate-600">
          SaleMap sẽ hiện banner offline rõ ràng. Ghi chú và follow-up đang nhập được lưu trên
          thiết bị, sau đó tự đồng bộ lại khi kết nối ổn định.
        </p>
      </section>
    </div>
  );
}
