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
    <section className="mt-6 rounded-card border border-warning/25 bg-warning-soft p-6 text-center shadow-card">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-control bg-surface text-amber-700">
        <LockKeyhole aria-hidden="true" className="h-7 w-7" />
      </div>
      <h2 className="mt-5 text-xl font-bold text-ink">Tính năng chưa mở cho bạn</h2>
      <p className="mx-auto mt-3 max-w-2xl text-base leading-8 text-amber-800">
        {FEATURE_FLAG_DISABLED_MESSAGE}
      </p>
      <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-control bg-sidebar px-5 py-3 text-base font-bold text-white transition hover:bg-primary"
          href="/app/dashboard"
        >
          Quay lại dashboard
        </Link>
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-control border border-warning/30 bg-surface px-5 py-3 text-base font-bold text-text-primary transition hover:border-warning"
          href="/app/feedback"
        >
          Gửi góp ý
        </Link>
      </div>
    </section>
  );
}
