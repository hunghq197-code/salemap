import { Flag } from "lucide-react";
import { toggleFeatureFlagAction } from "@/app/admin/feature-flags/actions";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { getGlobalFeatureFlags } from "@/lib/data/feature-flags";

export const dynamic = "force-dynamic";

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString("vi-VN") : "Chưa có";
}

export default async function AdminFeatureFlagsPage() {
  const flags = await getGlobalFeatureFlags();

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        description="Bật/tắt tính năng theo global flag để giảm rủi ro khi mở rộng user."
        title="Feature Flags"
      />

      {!flags.schemaReady ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
          Chưa thấy bảng feature_flags. Hãy chạy file SQL public-beta-readiness trong Supabase trước.
        </div>
      ) : null}

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <AdminKpiCard
          icon={<Flag className="h-5 w-5" />}
          label="Tổng flag"
          value={flags.items.length}
        />
        <AdminKpiCard
          label="Đang bật"
          value={flags.items.filter((flag) => flag.is_enabled).length}
        />
        <AdminKpiCard
          label="Đang tắt"
          value={flags.items.filter((flag) => !flag.is_enabled).length}
        />
      </section>

      <section className="mt-8">
        <AdminTable
          empty={flags.items.length === 0}
          headers={[
            "Flag key",
            "Name",
            "Description",
            "Enabled",
            "Rollout",
            "Updated at",
            "Action",
          ]}
        >
          {flags.items.map((flag) => {
            const toggleAction = toggleFeatureFlagAction.bind(
              null,
              flag.flag_key,
              !flag.is_enabled,
            );

            return (
              <tr key={flag.flag_key}>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-sm font-bold text-ink">
                  {flag.flag_key}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">
                  {flag.name}
                </td>
                <td className="min-w-[280px] px-4 py-3 text-slate-600">
                  {flag.description || "Chưa có"}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <AdminStatusBadge
                    tone={flag.is_enabled ? "green" : "red"}
                    value={flag.is_enabled ? "enabled" : "disabled"}
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {flag.rollout_percentage}%
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {formatDate(flag.updated_at)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <form action={toggleAction}>
                    <button
                      className="inline-flex min-h-9 items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-ink hover:border-ocean"
                      type="submit"
                    >
                      {flag.is_enabled ? "Tắt" : "Bật"}
                    </button>
                  </form>
                </td>
              </tr>
            );
          })}
        </AdminTable>
      </section>
    </div>
  );
}
