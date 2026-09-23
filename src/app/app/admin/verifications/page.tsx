import VerificationsList from "@/components/pages/app/admin/verifications/verifications-list";
import React, { memo } from "react";

export const dynamic = "force-dynamic";

const AdminVerificationsPage = () => <VerificationsList />;

export default memo(AdminVerificationsPage);
