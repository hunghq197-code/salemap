import Link from "next/link";
import { Sparkles } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { getAdminCmsPosts } from "@/lib/cms/posts";

export const dynamic = "force-dynamic";

function formatDate(value?: string | null) {
  if (!value) return "Chưa có";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminCmsPostsPage() {
  const posts = await getAdminCmsPosts("post");

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Quản lý bài SEO dạng blog post, draft/review/schedule/publish."
        title="CMS Posts"
      />
      <div className="mt-6">
        <div className="flex flex-wrap gap-2">
          <Link className="inline-flex min-h-11 items-center rounded-lg bg-ocean px-4 py-2 text-sm font-bold text-white" href="/admin/cms/posts/new">
            Tạo post
          </Link>
          <Link className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-ocean/30 px-4 py-2 text-sm font-bold text-ocean" href="/admin/cms/ai-agent">
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            AI SEO Agent
          </Link>
        </div>
      </div>
      {!posts.schemaReady ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          CMS schema chưa sẵn sàng. Hãy chạy `supabase/seo-cms.sql`.
        </div>
      ) : null}
      <section className="mt-6">
        <AdminTable empty={posts.items.length === 0} headers={["Updated", "Title", "Slug", "Status", "Published", "Edit"]}>
          {posts.items.map((post) => (
            <tr key={post.id}>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(post.updatedAt)}</td>
              <td className="min-w-[260px] px-4 py-3 font-bold text-ink">{post.title}</td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">{post.slug}</td>
              <td className="whitespace-nowrap px-4 py-3"><AdminStatusBadge value={post.status} /></td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(post.publishedAt)}</td>
              <td className="whitespace-nowrap px-4 py-3">
                <Link className="font-bold text-ocean hover:text-ink" href={`/admin/cms/posts/${post.id}`}>Sửa</Link>
              </td>
            </tr>
          ))}
        </AdminTable>
      </section>
    </div>
  );
}
