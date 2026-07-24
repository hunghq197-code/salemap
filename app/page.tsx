import type { Metadata } from "next";
import { AudienceSection } from "@/components/AudienceSection";
import { BetaFormSection } from "@/components/BetaFormSection";
import { ComparisonSection } from "@/components/ComparisonSection";
import { FAQSection } from "@/components/FAQSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { FinalCtaSection } from "@/components/FinalCtaSection";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { LeadFollowupSection } from "@/components/LeadFollowupSection";
import { LoginAccessStrip } from "@/components/LoginAccessStrip";
import { ProblemSection } from "@/components/ProblemSection";
import { RouteHighlightSection } from "@/components/RouteHighlightSection";
import { SolutionSection } from "@/components/SolutionSection";
import { getSiteUrl } from "@/lib/site-url";

const homeTitle = "SaleMap | Tìm khách, lưu lead và nhắc follow-up";
const homeDescription =
  "SaleMap giúp người làm sale tìm khách theo khu vực hoặc tuyến đường, lưu lead, ghi chú và nhắc follow-up trong một nơi.";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  description: homeDescription,
  openGraph: {
    description: homeDescription,
    title: homeTitle,
    url: "/",
  },
  title: homeTitle,
  twitter: {
    description: homeDescription,
    title: homeTitle,
  },
};

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    applicationCategory: "BusinessApplication",
    description: homeDescription,
    name: "SaleMap",
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      price: "0",
      priceCurrency: "VND",
    },
    operatingSystem: "Web",
    url: getSiteUrl(),
  };

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c"),
        }}
        type="application/ld+json"
      />
      <Header />
      <LoginAccessStrip />
      <main>
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksSection />
        <FeaturesSection />
        <RouteHighlightSection />
        <LeadFollowupSection />
        <AudienceSection />
        <ComparisonSection />
        <BetaFormSection />
        <FAQSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </>
  );
}
