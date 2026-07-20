"use client";

import { LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { trackFeatureFlagDisabledViewed } from "@/lib/analytics/client";

type FeatureDisabledNoticeProps = {
  flagKey: string;
};

const FEATURE_FLAG_DISABLED_MESSAGE =
  "Tính năng này đang được mở dần. Vui lòng quay lại sau.";

export function FeatureDisabledNotice({ flagKey }: FeatureDisabledNoticeProps) {
  useEffect(() => {
    trackFeatureFlagDisabledViewed(flagKey);
  }, [flagKey]);

  return (
    <section className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-6 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-white text-amber-700">
        <LockKeyhole aria-hidden="true" className="h-7 w-7" />
      </div>
      <h2 className="mt-5 text-xl font-bold text-ink">Tính năng chưa mở cho bạn</h2>
      <p className="mx-auto mt-3 max-w-2xl text-base leading-8 text-amber-800">
        {FEATURE_FLAG_DISABLED_MESSAGE}
      </p>
      <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-ink px-5 py-3 text-base font-bold text-white transition hover:bg-ocean"
          href="/app/dashboard"
        >
          Quay lại dashboard
        </Link>
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-lg border border-amber-300 bg-white px-5 py-3 text-base font-bold text-ink transition hover:border-amber-500"
          href="/app/feedback"
        >
          Gửi góp ý
        </Link>
      </div>
    </section>
  );
}
