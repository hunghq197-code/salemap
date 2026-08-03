import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { getAdminCmsTags } from "@/lib/cms/posts";

export const dynamic = "force-dynamic";

export default async function AdminCmsTagsPage() {
  const tags = await getAdminCmsTags();

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Thẻ CMS phục vụ phân loại nội dung SEO."
        title="CMS Tags"
      />
      {!tags.schemaReady ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          CMS schema chưa sẵn sàng. Hãy chạy `supabase/seo-cms.sql`.
        </div>
      ) : null}
      <section className="mt-6">
        <AdminTable empty={tags.items.length === 0} headers={["Name", "Slug", "Description"]}>
          {tags.items.map((tag) => (
            <tr key={tag.id}>
              <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{tag.name}</td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">{tag.slug}</td>
              <td className="min-w-[260px] px-4 py-3 text-slate-700">{tag.description || "-"}</td>
            </tr>
          ))}
        </AdminTable>
      </section>
    </div>
  );
}
