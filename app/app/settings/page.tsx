import {
  BarChart3,
  CreditCard,
  DatabaseZap,
  Download,
  FileSpreadsheet,
  HardDriveDownload,
  Mail,
  Sparkles,
  Smartphone,
  Target,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "@/components/app/LogoutButton";
import { NotificationSettingsForm } from "@/components/notifications/NotificationSettingsForm";
import { FeatureDisabledNotice } from "@/components/ui/FeatureDisabledNotice";
import { Toast } from "@/components/ui/Toast";
import { isFeatureEnabled } from "@/lib/data/feature-flags";
import { getNotificationSettings } from "@/lib/data/notification-settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSampleDataAction } from "./actions";

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SettingsPage(props: SettingsPageProps) {
  const searchParams = await props.searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name,role_type,industry,primary_city,primary_district")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();
  const [notificationSettings, emailNotificationsEnabled, sampleDataEnabled] =
    await Promise.all([
      getNotificationSettings(),
      isFeatureEnabled("email_notifications", user?.id),
      isFeatureEnabled("sample_data", user?.id),
    ]);

  return (
    <>
      <Toast code={getString(searchParams?.toast)} />
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
          Cài đặt
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">
          Tài khoản
        </h1>

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-mint/15 text-ocean">
              <UserRound aria-hidden="true" className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-ink">
                {profile?.full_name || "Người dùng SaleMap"}
              </h2>
              <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-500">
                <Mail aria-hidden="true" className="h-4 w-4" />
                {user?.email || "Chưa có email"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              ["Vai trò", profile?.role_type || "Chưa thiết lập"],
              ["Ngành", profile?.industry || "Chưa thiết lập"],
              ["Tỉnh/thành", profile?.primary_city || "Chưa thiết lập"],
              ["Quận/huyện", profile?.primary_district || "Chưa thiết lập"],
            ].map(([label, value]) => (
              <div className="rounded-lg bg-cloud px-4 py-3" key={label}>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  {label}
                </p>
                <p className="mt-1 text-sm font-bold text-ink">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink transition hover:border-ocean"
              href="/app/onboarding"
            >
              <Target aria-hidden="true" className="h-4 w-4" />
              Xem thiết lập ban đầu
            </Link>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <LogoutButton />
          </div>
        </section>

        <NotificationSettingsForm
          emailNotificationsEnabled={emailNotificationsEnabled}
          settings={notificationSettings}
        />

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-mint/15 text-ocean">
                <Smartphone aria-hidden="true" className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-ink">Cài SaleMap như app</h2>
                <p className="mt-2 text-base leading-7 text-slate-600">
                  Mở nhanh SaleMap từ màn hình chính khi đi thị trường.
                </p>
                <Link
                  className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink transition hover:border-ocean"
                  href="/app/install"
                >
                  Xem hướng dẫn cài
                </Link>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-ocean/10 text-ocean">
                <HardDriveDownload aria-hidden="true" className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-ink">Dữ liệu offline</h2>
                <p className="mt-2 text-base leading-7 text-slate-600">
                  Kiểm tra ghi chú và follow-up đang chờ đồng bộ.
                </p>
                <Link
                  className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink transition hover:border-ocean"
                  href="/app/offline"
                >
                  Xem hàng đợi offline
                </Link>
              </div>
            </div>
          </div>
        </section>

        {sampleDataEnabled ? (
          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-ocean/10 text-ocean">
                  <DatabaseZap aria-hidden="true" className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-ink">Dữ liệu mẫu</h2>
                  <p className="mt-2 text-base leading-7 text-slate-600">
                    Chỉ dùng nếu bạn muốn thử nhanh các màn hình lead, ghi chú và
                    follow-up.
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                    Nếu tài khoản đã có lead, SaleMap sẽ không tạo thêm dữ liệu mẫu.
                  </p>
                </div>
              </div>
              <form action={createSampleDataAction}>
                <button
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft transition hover:bg-[#5de0b3] sm:w-auto"
                  type="submit"
                >
                  <DatabaseZap aria-hidden="true" className="h-5 w-5" />
                  Tạo dữ liệu mẫu
                </button>
              </form>
            </div>
          </section>
        ) : (
          <FeatureDisabledNotice flagKey="sample_data" />
        )}

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-mint/15 text-ocean">
                <Download aria-hidden="true" className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-ink">Dữ liệu của bạn</h2>
                <p className="mt-2 text-base leading-7 text-slate-600">
                  Import lead từ Excel/CSV, tải lead cá nhân ra CSV hoặc dọn dữ liệu trùng/sai sau khi cần.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm transition hover:border-ocean sm:w-auto"
                href="/app/import"
              >
                <FileSpreadsheet aria-hidden="true" className="h-5 w-5" />
                Import lead từ Excel/CSV
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm transition hover:border-ocean sm:w-auto"
                href="/app/export"
              >
                <Download aria-hidden="true" className="h-5 w-5" />
                Xuất lead ra CSV
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm transition hover:border-ocean sm:w-auto"
                href="/app/leads/cleanup"
              >
                <Sparkles aria-hidden="true" className="h-5 w-5" />
                Dọn dữ liệu lead
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm transition hover:border-ocean sm:w-auto"
                href="/app/pipeline"
              >
                <DatabaseZap aria-hidden="true" className="h-5 w-5" />
                Pipeline bán hàng
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm transition hover:border-ocean sm:w-auto"
                href="/app/leads/views"
              >
                <Sparkles aria-hidden="true" className="h-5 w-5" />
                Quản lý góc nhìn lead
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm transition hover:border-ocean sm:w-auto"
                href="/app/analytics"
              >
                <BarChart3 aria-hidden="true" className="h-5 w-5" />
                Hiệu suất bán hàng
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm transition hover:border-ocean sm:w-auto"
                href="/app/analytics/goals"
              >
                <Target aria-hidden="true" className="h-5 w-5" />
                Mục tiêu cá nhân
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-ocean/10 text-ocean">
                <CreditCard aria-hidden="true" className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-ink">Gói sử dụng</h2>
                <p className="mt-2 text-base leading-7 text-slate-600">
                  Xem quota hôm nay, gói Free và gửi quan tâm nâng cấp khi
                  bạn cần dùng nhiều hơn.
                </p>
              </div>
            </div>
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm transition hover:border-ocean sm:w-auto"
              href="/app/billing"
            >
              <CreditCard aria-hidden="true" className="h-5 w-5" />
              Xem gói và quota
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
