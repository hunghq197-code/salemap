import { createCmsPostAction } from "@/app/admin/cms/actions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CmsPostForm } from "@/components/cms/CmsPostForm";
import { getCmsCategories } from "@/lib/cms/posts";

export const dynamic = "force-dynamic";

export default async function NewCmsPostPage() {
  const categories = await getCmsCategories();

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Tạo draft/review/scheduled/published content. Nội dung được sanitize server-side."
        title="Tạo nội dung CMS"
      />
      {!categories.schemaReady ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          CMS schema chưa sẵn sàng. Hãy chạy `supabase/seo-cms.sql`.
        </div>
      ) : null}
      <div className="mt-6">
        <CmsPostForm action={createCmsPostAction} categories={categories.items} />
      </div>
    </div>
  );
}
