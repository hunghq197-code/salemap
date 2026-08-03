import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { getCmsCategories } from "@/lib/cms/posts";

export const dynamic = "force-dynamic";

export default async function AdminCmsCategoriesPage() {
  const categories = await getCmsCategories();

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Danh mục CMS dùng cho primary category và archive blog."
        title="CMS Categories"
      />
      {!categories.schemaReady ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          CMS schema chưa sẵn sàng. Hãy chạy `supabase/seo-cms.sql`.
        </div>
      ) : null}
      <section className="mt-6">
        <AdminTable empty={categories.items.length === 0} headers={["Name", "Slug", "Description"]}>
          {categories.items.map((category) => (
            <tr key={category.id}>
              <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">{category.name}</td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">{category.slug}</td>
              <td className="min-w-[260px] px-4 py-3 text-slate-700">{category.description || "-"}</td>
            </tr>
          ))}
        </AdminTable>
      </section>
    </div>
  );
}
