import RedirectIfAuthenticated from "@/components/auth/redirect-if-authenticated";
import AuthStage from "@/components/pages/auth/auth-stage";
import React, { memo } from "react";

const LayoutPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RedirectIfAuthenticated>
    <AuthStage>{children}</AuthStage>
  </RedirectIfAuthenticated>
);

export default memo(LayoutPage);
