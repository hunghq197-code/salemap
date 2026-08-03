import type { CmsCategory, CmsPost } from "@/lib/cms/posts";
import { cmsContentTypeValues, cmsPostStatusValues } from "@/lib/cms/cms-status";

type CmsPostFormProps = {
  action: (formData: FormData) => Promise<void>;
  categories: CmsCategory[];
  post?: CmsPost | null;
};

const inputClass =
  "mt-1 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15";

export function CmsPostForm({ action, categories, post }: CmsPostFormProps) {
  return (
    <form action={action} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block text-sm font-bold text-ink">
          Title
          <input
            className={inputClass}
            defaultValue={post?.title ?? ""}
            maxLength={180}
            name="title"
            required
          />
        </label>
        <label className="block text-sm font-bold text-ink">
          Slug
          <input
            className={inputClass}
            defaultValue={post?.slug ?? ""}
            maxLength={120}
            name="slug"
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            required
          />
        </label>
        <label className="block text-sm font-bold text-ink">
          Excerpt
          <textarea
            className={`${inputClass} min-h-24`}
            defaultValue={post?.excerpt ?? ""}
            maxLength={500}
            name="excerpt"
          />
        </label>
        <label className="block text-sm font-bold text-ink">
          Content
          <textarea
            className={`${inputClass} min-h-[420px] font-mono leading-6`}
            defaultValue={post?.contentText ?? ""}
            maxLength={50000}
            name="contentText"
            required
          />
        </label>
      </section>

      <aside className="space-y-4">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-ink">Publish</h2>
          <div className="mt-4 grid gap-3">
            <label className="block text-sm font-bold text-ink">
              Content type
              <select className={inputClass} defaultValue={post?.contentType ?? "post"} name="contentType">
                {cmsContentTypeValues.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold text-ink">
              Status
              <select className={inputClass} defaultValue={post?.status ?? "draft"} name="status">
                {cmsPostStatusValues.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold text-ink">
              Scheduled at
              <input
                className={inputClass}
                defaultValue={post?.scheduledAt ? post.scheduledAt.slice(0, 16) : ""}
                name="scheduledAt"
                type="datetime-local"
              />
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm font-bold text-ink">
              <input defaultChecked={post?.noindex ?? false} name="noindex" type="checkbox" />
              Noindex
            </label>
          </div>
          <button
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-ocean px-4 py-2 text-sm font-bold text-white"
            type="submit"
          >
            Lưu nội dung
          </button>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-ink">Taxonomy</h2>
          <label className="mt-4 block text-sm font-bold text-ink">
            Primary category
            <select
              className={inputClass}
              defaultValue={post?.primaryCategoryId ?? ""}
              name="primaryCategoryId"
            >
              <option value="">Chưa chọn</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-ink">SEO</h2>
          <div className="mt-4 grid gap-3">
            <label className="block text-sm font-bold text-ink">
              SEO title
              <input className={inputClass} defaultValue={post?.seoTitle ?? ""} maxLength={70} name="seoTitle" />
            </label>
            <label className="block text-sm font-bold text-ink">
              SEO description
              <textarea className={`${inputClass} min-h-20`} defaultValue={post?.seoDescription ?? ""} maxLength={170} name="seoDescription" />
            </label>
            <label className="block text-sm font-bold text-ink">
              Canonical path
              <input className={inputClass} defaultValue={post?.canonicalPath ?? ""} name="canonicalPath" placeholder="/blog/slug" />
            </label>
            <label className="block text-sm font-bold text-ink">
              Open Graph title
              <input className={inputClass} defaultValue={post?.ogTitle ?? ""} maxLength={80} name="ogTitle" />
            </label>
            <label className="block text-sm font-bold text-ink">
              Open Graph description
              <textarea className={`${inputClass} min-h-20`} defaultValue={post?.ogDescription ?? ""} maxLength={220} name="ogDescription" />
            </label>
            <label className="block text-sm font-bold text-ink">
              Featured image URL
              <input className={inputClass} defaultValue={post?.featuredImageUrl ?? ""} name="featuredImageUrl" type="url" />
            </label>
            <label className="block text-sm font-bold text-ink">
              Featured image alt
              <input className={inputClass} defaultValue={post?.featuredImageAlt ?? ""} maxLength={180} name="featuredImageAlt" />
            </label>
            <label className="block text-sm font-bold text-ink">
              OG image URL
              <input className={inputClass} defaultValue={post?.ogImageUrl ?? ""} name="ogImageUrl" type="url" />
            </label>
          </div>
        </section>
      </aside>
    </form>
  );
}
