import Inquiries from "@/components/pages/app/admin/moderation/inquiries";
import React, { memo } from "react";

export const dynamic = "force-dynamic";

const Page = () => <Inquiries scope="sales" />;

export default memo(Page);
