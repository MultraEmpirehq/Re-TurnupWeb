import PerformersManager from "@/components/pages/app/performers/performers-manager";
import { Suspense } from "react";

export default function PerformersPage() {
  return (
    <Suspense>
      <PerformersManager />
    </Suspense>
  );
}
