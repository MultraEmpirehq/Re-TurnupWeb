import Unsubscribe from "@/components/pages/unsubscribe/unsubscribe";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Unsubscribe | Turnupz",
  robots: { index: false, follow: false },
};

export default function UnsubscribePage() {
  return (
    <Suspense>
      <Unsubscribe />
    </Suspense>
  );
}
