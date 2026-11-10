import RequireVendorVerification from "@/components/auth/require-vendor-verification";
import React, { memo } from "react";

const CreateEventLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <RequireVendorVerification>{children}</RequireVendorVerification>;
};

export default memo(CreateEventLayout);
