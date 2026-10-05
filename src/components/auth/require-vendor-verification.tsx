"use client";

import BrandLoader from "@/components/ui/brand-loader";
import useVendorVerificationStatus from "@/hooks/use-vendor-verification-status";
import { ROUTES } from "@/lib/variables";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export const VENDOR_VERIFICATION_ROUTE = ROUTES.VENDOR_VERIFICATION.href;

/**
 * Only approved vendors (and admins) get past this; anyone else is sent to the
 * verification page with `message`. The status comes from the api, through
 * `useVendorVerificationStatus`.
 */
const RequireVendorVerification: React.FC<{
  children: React.ReactNode;
  message?: string;
}> = ({
  children,
  message = "Verify your vendor account before creating an event.",
}) => {
  const router = useRouter();
  const { isApproved, isChecking } = useVendorVerificationStatus();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (isChecking || isApproved || hasRedirectedRef.current) {
      return;
    }
    hasRedirectedRef.current = true;
    toast.error(message);
    router.replace(VENDOR_VERIFICATION_ROUTE);
  }, [isChecking, isApproved, message, router]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <BrandLoader />
      </div>
    );
  }

  if (!isApproved) {
    return null;
  }

  return <>{children}</>;
};

export default RequireVendorVerification;
