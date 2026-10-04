import AuditLogList from "@/components/pages/app/admin/audit-log/audit-log-list";
import React, { memo } from "react";

export const dynamic = "force-dynamic";

const AdminAuditLogPage = () => <AuditLogList />;

export default memo(AdminAuditLogPage);
