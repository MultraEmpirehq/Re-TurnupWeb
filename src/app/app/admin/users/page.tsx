import UsersList from "@/components/pages/app/admin/users/users-list";
import React, { memo } from "react";

export const dynamic = "force-dynamic";

const AdminUsersPage = () => <UsersList />;

export default memo(AdminUsersPage);
