import ComingSoon from "@/components/pages/coming-soon/coming-soon";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Join the TurnUpz Waitlist",
  description:
    "Discover events, make plans with your people, and hear when TurnUpz becomes available in your city.",
};

export default function Page() {
  return (
    <Suspense>
      <ComingSoon />
    </Suspense>
  );
}
