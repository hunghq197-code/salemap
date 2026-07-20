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

export default function Home() {
  return (
    <>
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
