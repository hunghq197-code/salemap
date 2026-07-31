import { MapPinned, Search } from "lucide-react";

const keywordSuggestions = [
  "Nhà thuốc",
  "Quán ăn",
  "Spa",
  "Đại lý vật liệu",
  "Cửa hàng tiện lợi",
];

export function DiscoveryEmptyState() {
  return (
    <section className="rounded-card border border-dashed border-border-strong bg-surface p-5 text-center shadow-card">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-control bg-primary-soft text-primary">
        <MapPinned aria-hidden="true" className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-xl font-bold text-text-primary">
        Tìm khách hàng tiềm năng quanh bạn
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-secondary">
        Nhập loại khách hàng bạn muốn tìm, chọn khu vực và bắt đầu khám phá.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {keywordSuggestions.map((keyword) => (
          <span
            className="inline-flex items-center gap-1 rounded-full border border-border-soft bg-surface-muted px-3 py-1.5 text-xs font-bold text-text-secondary"
            key={keyword}
          >
            <Search aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
            {keyword}
          </span>
        ))}
      </div>
    </section>
  );
}
