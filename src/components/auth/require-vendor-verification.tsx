"use client";

import { getData } from "@/api";
import { VerificationStatus } from "@/components/pages/app/vendor-verification";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const VENDOR_VERIFICATION_ROUTE = "/app/settings/vendor-verification";

interface IVerificationStatusResponse {
  status?: VerificationStatus;
}

/**
 * Only approved vendors get past this. The answer comes from the API alone: the
 * browser's saved verification snapshot isn't tied to an account, so trusting it
 * would let whoever last signed in on this browser decide.
 */
const RequireVendorVerification: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const [status, setStatus] = useState<VerificationStatus | undefined>();
  const [isChecking, setIsChecking] = useState(true);
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    let isActive = true;
    getData<IVerificationStatusResponse>("/vendor/verification")
      .then(({ data }) => {
        if (isActive) setStatus(data?.data?.status);
      })
      .catch(() => undefined)
      .finally(() => {
        if (isActive) setIsChecking(false);
      });
    return () => {
      isActive = false;
    };
  }, []);

  const isApproved = status === "approved";

  useEffect(() => {
    if (isChecking || isApproved || hasRedirectedRef.current) {
      return;
    }
    hasRedirectedRef.current = true;
    toast.error("Verify your vendor account before creating an event.");
    router.replace(VENDOR_VERIFICATION_ROUTE);
  }, [isChecking, isApproved, router]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
      </div>
    );
  }

  if (!isApproved) {
    return null;
  }

  return <>{children}</>;
};

export default RequireVendorVerification;
