import VendorScanPage from "@/components/pages/app/scan/vendor-scan-page";
import { Suspense } from "react";

export default function ScanPage() {
  return (
    <Suspense>
      <VendorScanPage />
    </Suspense>
  );
}
