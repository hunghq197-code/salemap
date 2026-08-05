import { ExternalLink, MessageCircle, PhoneCall } from "lucide-react";

const supportChannels = [
  {
    description: "Cập nhật thông báo, phản hồi nhanh và tin tức SaleMap.",
    href: "https://www.facebook.com/salemap.io.vn/",
    icon: ExternalLink,
    label: "Fanpage SaleMap",
  },
  {
    description: "Nhắn Zalo hoặc gọi hỗ trợ khi cần xử lý nhanh.",
    href: "https://zalo.me/0963954197",
    icon: MessageCircle,
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
        <PhoneCall aria-hidden="true" className="hidden h-6 w-6 shrink-0 text-primary sm:block" />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {supportChannels.map((channel) => {
          const Icon = channel.icon;

          return (
            <a
              className="group flex min-h-14 items-start gap-3 rounded-control border border-border-soft bg-background px-4 py-3 transition hover:border-primary/40 hover:bg-primary-soft"
              href={channel.href}
              key={channel.href}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary transition group-hover:bg-primary group-hover:text-white">
                <Icon aria-hidden="true" className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-bold text-text-primary">
                  {channel.label}
                </span>
                <span className="mt-1 block text-xs font-semibold leading-5 text-text-secondary">
                  {channel.description}
                </span>
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
