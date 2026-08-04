import {
  BookOpenText,
  FileText,
  ImageIcon,
  Layers3,
  Link2,
  Sparkles,
  Tags,
} from "lucide-react";
import Link from "next/link";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { getAdminCmsDashboard } from "@/lib/cms/posts";

export const dynamic = "force-dynamic";

function formatDate(value?: string | null) {
  if (!value) return "Chưa có";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminCmsPage() {
  const cms = await getAdminCmsDashboard();

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="CMS SEO cho bài viết, trang, lịch đăng, revisions, media metadata và redirects."
        title="SEO CMS"
      />

      {!cms.schemaReady ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          CMS schema chưa sẵn sàng. Hãy chạy `supabase/seo-cms.sql`.
        </div>
      ) : null}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminKpiCard icon={<BookOpenText className="h-5 w-5" />} label="Posts" value={cms.kpis.posts} />
        <AdminKpiCard icon={<FileText className="h-5 w-5" />} label="Pages" value={cms.kpis.pages} />
        <AdminKpiCard icon={<Layers3 className="h-5 w-5" />} label="Categories" value={cms.kpis.categories} />
        <AdminKpiCard icon={<Tags className="h-5 w-5" />} label="Tags" value={cms.kpis.tags} />
        <AdminKpiCard icon={<ImageIcon className="h-5 w-5" />} label="Media" value={cms.kpis.media} />
        <AdminKpiCard label="Draft" value={cms.kpis.drafts} />
        <AdminKpiCard label="Review" value={cms.kpis.review} />
        <AdminKpiCard label="Scheduled" value={cms.kpis.scheduled} />
        <AdminKpiCard label="Published" value={cms.kpis.published} />
        <AdminKpiCard icon={<Link2 className="h-5 w-5" />} label="Redirects" value={cms.kpis.redirects} />
      </section>

      <section className="mt-6 flex flex-wrap gap-2">
        <Link className="inline-flex min-h-11 items-center rounded-lg bg-ocean px-4 py-2 text-sm font-bold text-white" href="/admin/cms/posts/new">
          Tạo nội dung
        </Link>
        <Link className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-ocean/30 px-4 py-2 text-sm font-bold text-ocean" href="/admin/cms/ai-agent">
          <Sparkles aria-hidden="true" className="h-4 w-4" />
          AI SEO Agent
        </Link>
        <Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-ink" href="/admin/cms/posts">
          Posts
        </Link>
        <Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-ink" href="/admin/cms/pages">
          Pages
        </Link>
        <Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-ink" href="/admin/cms/categories">
          Categories
        </Link>
        <Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-ink" href="/admin/cms/tags">
          Tags
        </Link>
        <Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-ink" href="/admin/cms/media">
          Media
        </Link>
        <Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-ink" href="/admin/cms/redirects">
          Redirects
        </Link>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-xl font-bold text-ink">Nội dung gần đây</h2>
        <AdminTable empty={cms.recentPosts.length === 0} headers={["Updated", "Title", "Type", "Status", "Public", "Edit"]}>
          {cms.recentPosts.map((post) => (
            <tr key={post.id}>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {formatDate(post.updatedAt)}
              </td>
              <td className="min-w-[260px] px-4 py-3 font-bold text-ink">{post.title}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{post.contentType}</td>
              <td className="whitespace-nowrap px-4 py-3">
                <AdminStatusBadge value={post.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                {post.status === "published" ? (
                  <Link className="font-bold text-ocean hover:text-ink" href={post.contentType === "post" ? `/blog/${post.slug}` : `/${post.slug}`}>
                    Mở
                  </Link>
                ) : (
                  <span className="text-slate-500">Không public</span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <Link className="font-bold text-ocean hover:text-ink" href={`/admin/cms/posts/${post.id}`}>
                  Sửa
                </Link>
              </td>
            </tr>
          ))}
        </AdminTable>
      </section>
    </div>
  );
}
