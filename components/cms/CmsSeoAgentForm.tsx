import { Sparkles } from "lucide-react";
import type { CmsCategory } from "@/lib/cms/posts";
import { cmsSeoAgentFormSearchIntentValues } from "@/lib/validators/cms";

type CmsSeoAgentFormProps = {
  action: (formData: FormData) => Promise<void>;
  categories: CmsCategory[];
};

const inputClass =
  "mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15";

const intentLabels: Record<(typeof cmsSeoAgentFormSearchIntentValues)[number], string> = {
  auto: "Auto-select",
  commercial: "Commercial",
  comparison: "Comparison",
  informational: "Informational",
  local: "Local",
};

export function CmsSeoAgentForm({ action, categories }: CmsSeoAgentFormProps) {
  return (
    <form action={action} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block text-sm font-bold text-ink">
          Mục tiêu kinh doanh
          <input
            className={inputClass}
            defaultValue="Tăng traffic chất lượng cho SaleMap từ nhóm chủ doanh nghiệp nhỏ và sales thị trường"
            maxLength={220}
            name="businessGoal"
            required
          />
        </label>
        <label className="block text-sm font-bold text-ink">
          Chủ đề seed
          <input
            className={inputClass}
            maxLength={180}
            name="topic"
            placeholder="Để trống nếu muốn agent tự chọn"
          />
        </label>
        <label className="block text-sm font-bold text-ink">
          Từ khóa seed
          <input
            className={inputClass}
            maxLength={120}
            name="primaryKeyword"
            placeholder="Để trống nếu muốn agent tự tìm"
          />
        </label>
        <label className="block text-sm font-bold text-ink">
          Từ khóa phụ
          <input
            className={inputClass}
            maxLength={260}
            name="secondaryKeywords"
            placeholder="lead sales, quản lý khách hàng, chăm sóc khách hàng"
          />
        </label>
        <label className="block text-sm font-bold text-ink">
          Đối tượng độc giả
          <input
            className={inputClass}
            defaultValue="Chủ doanh nghiệp nhỏ, sales thị trường và đội bán hàng B2B tại Việt Nam"
            maxLength={220}
            name="audience"
            required
          />
        </label>
        <label className="block text-sm font-bold text-ink">
          Ghi chú biên tập
          <textarea
            className={`${inputClass} min-h-40`}
            maxLength={1200}
            name="notes"
            placeholder="Góc nhìn SaleMap, ví dụ thực tế, điểm cần tránh, sản phẩm cần nhắc nhẹ..."
          />
        </label>
      </section>

      <aside className="space-y-4">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-ink">Agent settings</h2>
          <div className="mt-4 grid gap-3">
            <label className="block text-sm font-bold text-ink">
              Search intent
              <select className={inputClass} defaultValue="auto" name="searchIntent">
                {cmsSeoAgentFormSearchIntentValues.map((intent) => (
                  <option key={intent} value={intent}>
                    {intentLabels[intent]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold text-ink">
              Primary category
              <select className={inputClass} defaultValue="" name="primaryCategoryId">
                <option value="">Chưa chọn</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm font-bold text-ink">
              <input defaultChecked name="generateImage" type="checkbox" />
              Tạo ảnh hero bằng AI
            </label>
          </div>
          <button
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-ocean px-4 py-2 text-sm font-bold text-white"
            type="submit"
          >
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            Auto plan + tạo draft
          </button>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-ink">Output</h2>
          <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-slate-600">
            <p>Status: review</p>
            <p>Content type: post</p>
            <p>Public path: /blog/generated-slug</p>
            <p>Image: optional CMS media</p>
          </div>
        </section>
      </aside>
    </form>
  );
}
