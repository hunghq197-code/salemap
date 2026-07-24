import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Onboarding - SaleMap",
};

type OnboardingPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OnboardingPage(props: OnboardingPageProps) {
  const searchParams = await props.searchParams;
  const editMode = getString(searchParams?.edit) === "1";
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

  return (
    <main className="min-h-screen bg-cloud px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
          Thiết lập SaleMap
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-ink sm:text-5xl">
          Thiết lập SaleMap cho cách bán hàng của bạn
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
          Trả lời vài câu hỏi ngắn để SaleMap gợi ý luồng làm việc phù hợp hơn.
        </p>
        <div className="mt-8">
          {profile?.onboarding_completed && !editMode ? (
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
              <h2 className="text-2xl font-bold text-ink">
                Bạn đã hoàn tất thiết lập ban đầu.
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Bạn có thể quay về dashboard để tiếp tục làm việc hoặc cập nhật lại thông tin nếu cách bán hàng đã thay đổi.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft hover:bg-[#5de0b3]"
                  href="/app/dashboard"
                >
                  Về Dashboard
                </Link>
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink shadow-sm hover:border-ocean"
                  href="/onboarding?edit=1"
                >
                  Cập nhật thông tin
                </Link>
              </div>
            </section>
          ) : (
            <OnboardingForm />
          )}
        </div>
      </div>
    </main>
  );
}
