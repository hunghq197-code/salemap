import { Suspense } from "react";
import Script from "next/script";
import { GoogleAnalyticsPageTracker } from "@/components/analytics/GoogleAnalyticsPageTracker";

function getSafeGoogleAnalyticsMeasurementId() {
  const measurementId = (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "")
    .trim()
    .toUpperCase();

  return /^G-[A-Z0-9]+$/.test(measurementId) ? measurementId : undefined;
}

export function GoogleAnalyticsScript() {
  const measurementId = getSafeGoogleAnalyticsMeasurementId();

  if (!measurementId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
          window.gtag("js", new Date());
          window.gtag("config", "${measurementId}", { send_page_view: false });
        `}
      </Script>
      <Suspense fallback={null}>
        <GoogleAnalyticsPageTracker />
      </Suspense>
    </>
  );
}
