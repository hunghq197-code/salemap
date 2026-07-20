import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Onboarding - SaleMap",
};

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("onboarding_completed")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed) {
    redirect("/app/dashboard");
  }

  return (
    <main className="min-h-screen bg-cloud px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
          Thiết lập workspace
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-ink sm:text-5xl">
          Cho SaleMap biết cách bạn đang bán hàng
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
          Hoàn tất vài bước ngắn để dashboard và dữ liệu lead cá nhân khớp hơn
          với công việc hằng ngày của bạn.
        </p>
        <div className="mt-8">
          <OnboardingForm />
        </div>
      </div>
    </main>
  );
}
