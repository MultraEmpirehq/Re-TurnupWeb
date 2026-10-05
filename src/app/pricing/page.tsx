import PricingPage from "@/components/pages/pricing/pricing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Turnupz",
  description:
    "Free events are free. Paid events cost a small fee per ticket sold, which you can keep or pass on to buyers.",
};

export default function Pricing() {
  return <PricingPage />;
}
