import AdminsList from "@/components/pages/app/admin/admins/admins-list";
import React, { memo } from "react";

export const dynamic = "force-dynamic";

const AdminAdminsPage = () => <AdminsList />;

export default memo(AdminAdminsPage);
