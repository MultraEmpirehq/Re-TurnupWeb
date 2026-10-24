import { FeaturedBoost } from "@/components/pages/explore/sponsored";
import AppShowcase from "@/components/pages/home/landing/app-showcase";
import ClosingCta from "@/components/pages/home/landing/closing-cta";
import ForOrganisers from "@/components/pages/home/landing/for-organisers";
import LandingHero from "@/components/pages/home/landing/hero";
import HowItWorks from "@/components/pages/home/landing/how-it-works";
import VibeLinks from "@/components/pages/home/landing/vibe-links";

export default function Home() {
  return (
    <div>
      <LandingHero />
      {/* A boosted event, labelled Sponsored; nothing shows when none is live. */}
      <FeaturedBoost />
      <AppShowcase />
      <ForOrganisers />
      {/* <VibeLinks /> */}
      <HowItWorks />
      
      {/* <ClosingCta /> */}
    </div>
  );
}
