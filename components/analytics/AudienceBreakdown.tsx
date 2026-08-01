import { ChartContainer } from "@/components/analytics/ChartContainer";
import type {
  CategoryBreakdownItem,
  TagBreakdownItem,
} from "@/lib/analytics/sales-analytics";

type AudienceBreakdownProps = {
  categories: CategoryBreakdownItem[];
  error?: boolean;
  tags: TagBreakdownItem[];
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function AudienceBreakdown({
  categories,
  error = false,
  tags,
}: AudienceBreakdownProps) {
  if (!error && tags.length === 0 && categories.length === 0) {
    return null;
  }

  return (
    <ChartContainer
      description="Chỉ hiển thị tag và category đã có trong lead của bạn."
      error={error}
      title="Nhóm khách nổi bật"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-text-muted">Tags</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.length > 0 ? (
              tags.map((tag) => (
                <span
                  className="rounded-full border border-border-soft bg-surface-muted px-3 py-1 text-sm font-bold text-text-primary"
                  key={tag.tagId}
                >
                  {tag.tagName} · {formatNumber(tag.totalLeads)}
                </span>
              ))
            ) : (
              <p className="text-sm leading-6 text-text-secondary">Chưa có tag đủ dữ liệu.</p>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-text-muted">Categories</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.length > 0 ? (
              categories.map((category) => (
                <span
                  className="rounded-full border border-border-soft bg-surface-muted px-3 py-1 text-sm font-bold text-text-primary"
                  key={category.category}
                >
                  {category.category} · {formatNumber(category.totalLeads)}
                </span>
              ))
            ) : (
              <p className="text-sm leading-6 text-text-secondary">
                Chưa có category đủ dữ liệu.
              </p>
            )}
          </div>
        </div>
      </div>
    </ChartContainer>
  );
}
