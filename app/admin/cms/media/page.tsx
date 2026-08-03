import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { getAdminCmsMedia } from "@/lib/cms/posts";

export const dynamic = "force-dynamic";

function formatSize(bytes: number) {
  if (bytes <= 0) return "-";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function AdminCmsMediaPage() {
  const media = await getAdminCmsMedia();

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Media metadata library. Upload/storage validation sẽ được nối khi Supabase Storage bucket được cấu hình."
        title="CMS Media"
      />
      {!media.schemaReady ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          CMS schema chưa sẵn sàng. Hãy chạy `supabase/seo-cms.sql`.
        </div>
      ) : null}
      <section className="mt-6">
        <AdminTable empty={media.items.length === 0} headers={["File", "MIME", "Size", "Alt", "Status"]}>
          {media.items.map((item) => (
            <tr key={item.id}>
              <td className="min-w-[240px] px-4 py-3 font-bold text-ink">{item.fileName}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{item.mimeType}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatSize(item.sizeBytes)}</td>
              <td className="min-w-[220px] px-4 py-3 text-slate-700">{item.altText || "-"}</td>
              <td className="whitespace-nowrap px-4 py-3"><AdminStatusBadge value={item.status} /></td>
            </tr>
          ))}
        </AdminTable>
      </section>
    </div>
  );
}
