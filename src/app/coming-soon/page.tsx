import ComingSoon from "@/components/pages/coming-soon/coming-soon";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Turnupz is almost here",
  description:
    "Find what's on, book in a few taps and walk in with one scan. Join the waitlist and be first in.",
};

export default function Page() {
  return (
    <Suspense>
      <ComingSoon />
    </Suspense>
  );
}
