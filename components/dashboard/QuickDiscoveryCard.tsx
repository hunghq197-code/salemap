import { MapPinned, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const keywordSuggestions = ["Nhà thuốc", "Quán ăn", "Spa", "Đại lý", "Cửa hàng"];

export function QuickDiscoveryCard() {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border-soft bg-sidebar px-5 py-5 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-control bg-white/10 text-accent">
            <MapPinned aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Map Discovery
            </p>
            <h2 className="mt-1 text-lg font-bold">Tìm khách quanh khu vực</h2>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-300">
          Khám phá doanh nghiệp và điểm bán tiềm năng quanh vị trí hoặc khu vực bạn chọn.
        </p>
      </div>

      <div className="p-4 sm:p-5">
        <form action="/app/discover" className="grid gap-3" method="get">
          <label className="text-sm font-bold text-text-primary">
            Keyword nhanh
            <div className="relative mt-2">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted"
              />
              <input
                autoComplete="off"
                className="min-h-11 w-full rounded-control border border-border-soft bg-surface py-2 pl-11 pr-3 text-base text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                maxLength={100}
                name="keyword"
                placeholder="Ví dụ: nhà thuốc"
              />
            </div>
          </label>
          <Button icon={<Search aria-hidden="true" className="h-4 w-4" />} type="submit">
            Tìm khách mới
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {keywordSuggestions.map((keyword) => (
            <Link
              className="rounded-full border border-border-soft bg-surface-muted px-3 py-1.5 text-xs font-bold text-text-secondary transition hover:border-primary/40 hover:text-primary"
              href={`/app/discover?keyword=${encodeURIComponent(keyword)}`}
              key={keyword}
              prefetch={false}
            >
              {keyword}
            </Link>
          ))}
        </div>
      </div>
    </Card>
  );
}
