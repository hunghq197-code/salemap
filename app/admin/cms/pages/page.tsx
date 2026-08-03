import Link from "next/link";
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

export default async function AdminCmsPagesPage() {
  const pages = await getAdminCmsPosts("page");

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Quản lý CMS pages public ngoài app/admin/dashboard."
        title="CMS Pages"
      />
      <div className="mt-6">
        <Link className="inline-flex min-h-11 items-center rounded-lg bg-ocean px-4 py-2 text-sm font-bold text-white" href="/admin/cms/posts/new">
          Tạo page
        </Link>
      </div>
      {!pages.schemaReady ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          CMS schema chưa sẵn sàng. Hãy chạy `supabase/seo-cms.sql`.
        </div>
      ) : null}
      <section className="mt-6">
        <AdminTable empty={pages.items.length === 0} headers={["Updated", "Title", "Slug", "Status", "Published", "Edit"]}>
          {pages.items.map((page) => (
            <tr key={page.id}>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(page.updatedAt)}</td>
              <td className="min-w-[260px] px-4 py-3 font-bold text-ink">{page.title}</td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">{page.slug}</td>
              <td className="whitespace-nowrap px-4 py-3"><AdminStatusBadge value={page.status} /></td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(page.publishedAt)}</td>
              <td className="whitespace-nowrap px-4 py-3">
                <Link className="font-bold text-ocean hover:text-ink" href={`/admin/cms/posts/${page.id}`}>Sửa</Link>
              </td>
            </tr>
          ))}
        </AdminTable>
      </section>
    </div>
  );
}
