import { notFound } from "next/navigation";
import { updateCmsPostAction } from "@/app/admin/cms/actions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { CmsPostForm } from "@/components/cms/CmsPostForm";
import { getAdminCmsPost } from "@/lib/cms/posts";

export const dynamic = "force-dynamic";

type AdminCmsPostPageProps = {
  params: Promise<{
    postId: string;
  }>;
};

function formatDate(value?: string | null) {
  if (!value) return "Chưa có";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminCmsPostPage(props: AdminCmsPostPageProps) {
  const { postId } = await props.params;
  const result = await getAdminCmsPost(postId);

  if (!result) notFound();

  const updateAction = updateCmsPostAction.bind(null, result.post.id);

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Lưu nội dung tạo revision mới. Nếu đổi slug khi đã publish, hệ thống tạo 301 redirect."
        title={result.post.title || "CMS content"}
      />
      {!result.schemaReady ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          CMS schema chưa sẵn sàng. Hãy chạy `supabase/seo-cms.sql`.
        </div>
      ) : null}
      <div className="mt-6">
        <CmsPostForm action={updateAction} categories={result.categories} post={result.post} />
      </div>
      <section className="mt-8">
        <h2 className="mb-3 text-xl font-bold text-ink">Revisions</h2>
        <AdminTable empty={result.post.revisions.length === 0} headers={["Revision", "Title", "Status", "Created"]}>
          {result.post.revisions.map((revision) => (
            <tr key={revision.id}>
              <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">
                #{revision.revisionNumber}
              </td>
              <td className="min-w-[260px] px-4 py-3 text-slate-700">{revision.title}</td>
              <td className="whitespace-nowrap px-4 py-3">
                <AdminStatusBadge value={revision.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {formatDate(revision.createdAt)}
              </td>
            </tr>
          ))}
        </AdminTable>
      </section>
    </div>
  );
}
