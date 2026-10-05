import AppShowcase from "@/components/pages/home/landing/app-showcase";
import ClosingCta from "@/components/pages/home/landing/closing-cta";
import ForOrganisers from "@/components/pages/home/landing/for-organisers";
import LandingHero from "@/components/pages/home/landing/hero";
import HowItWorks from "@/components/pages/home/landing/how-it-works";
import PastMarquee from "@/components/pages/home/landing/past-marquee";
import VibePicker from "@/components/pages/home/landing/vibe-picker";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div>
      <LandingHero />
      <AppShowcase />
      <VibePicker />
      <HowItWorks />
      <ForOrganisers />
      <PastMarquee />
      <ClosingCta />
    </div>
  );
}
