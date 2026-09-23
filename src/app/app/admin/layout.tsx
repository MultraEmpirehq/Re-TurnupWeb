import RequireAdmin from "@/components/auth/require-admin";
import React, { memo } from "react";

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <RequireAdmin>{children}</RequireAdmin>;
};

export default memo(AdminLayout);
