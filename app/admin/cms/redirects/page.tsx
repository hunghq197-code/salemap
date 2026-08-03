import { CmsRedirectForm } from "@/components/cms/CmsRedirectForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { getAdminCmsRedirects } from "@/lib/cms/posts";

export const dynamic = "force-dynamic";

function formatDate(value?: string | null) {
  if (!value) return "Chưa có";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminCmsRedirectsPage() {
  const redirects = await getAdminCmsRedirects();

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Quản lý 301/302 redirect nội bộ cho URL public."
        title="CMS Redirects"
      />
      {!redirects.schemaReady ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          CMS schema chưa sẵn sàng. Hãy chạy `supabase/seo-cms.sql`.
        </div>
      ) : null}
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <CmsRedirectForm />
      </section>
      <section className="mt-6">
        <AdminTable empty={redirects.items.length === 0} headers={["Created", "Source", "Destination", "Code", "Active"]}>
          {redirects.items.map((redirect) => (
            <tr key={redirect.id}>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(redirect.createdAt)}</td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-700">{redirect.sourcePath}</td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-700">{redirect.destinationPath}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{redirect.statusCode}</td>
              <td className="whitespace-nowrap px-4 py-3">
                <AdminStatusBadge value={redirect.isActive ? "active" : "inactive"} />
              </td>
            </tr>
          ))}
        </AdminTable>
      </section>
    </div>
  );
}
