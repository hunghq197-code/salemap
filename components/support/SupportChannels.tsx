import { ExternalLink, PhoneCall } from "lucide-react";

const supportChannels = [
  {
    accentClassName: "bg-[#1877F2] text-white shadow-[#1877F2]/20",
    brandMark: "f",
    brandMarkClassName: "text-3xl font-black",
    ctaLabel: "Mở Fanpage",
    description: "Cập nhật thông báo, phản hồi nhanh và tin tức SaleMap.",
    href: "https://www.facebook.com/salemap.io.vn/",
    label: "Fanpage SaleMap",
  },
  {
    accentClassName: "bg-[#0068FF] text-white shadow-[#0068FF]/20",
    brandMark: "Zalo",
    brandMarkClassName: "text-[13px] font-black",
    ctaLabel: "Nhắn Zalo",
    description: "Nhắn Zalo hoặc gọi hỗ trợ khi cần xử lý nhanh.",
    href: "https://zalo.me/0963954197",
    label: "Zalo: 0963.954.197",
  },
] as const;

type SupportChannelsProps = {
  compact?: boolean;
};

export function SupportChannels({ compact = false }: SupportChannelsProps) {
  return (
    <section
      className={[
        "rounded-card border border-border-soft bg-surface shadow-sm",
        compact ? "p-4" : "p-5",
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
            Kênh hỗ trợ
          </p>
          <h2 className="mt-2 text-lg font-bold text-text-primary">
            Liên hệ SaleMap trực tiếp
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-text-secondary">
            Dùng ticket để theo dõi vấn đề chi tiết; dùng Fanpage hoặc Zalo khi bạn cần hỗ trợ nhanh.
          </p>
        </div>
        <PhoneCall
          aria-hidden="true"
          className="hidden h-6 w-6 shrink-0 text-primary sm:block"
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {supportChannels.map((channel) => (
          <a
            className="group flex min-h-24 items-center gap-4 rounded-card border border-border-soft bg-background px-4 py-3 transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary-soft hover:shadow-sm"
            href={channel.href}
            key={channel.href}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span
              className={[
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-full shadow-lg transition group-hover:scale-105",
                channel.accentClassName,
              ].join(" ")}
            >
              <span aria-hidden="true" className={channel.brandMarkClassName}>
                {channel.brandMark}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-text-primary">
                {channel.label}
              </span>
              <span className="mt-1 block text-xs font-semibold leading-5 text-text-secondary">
                {channel.description}
              </span>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary">
                {channel.ctaLabel}
                <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
              </span>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
