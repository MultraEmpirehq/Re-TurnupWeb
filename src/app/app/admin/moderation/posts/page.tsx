import ReportedPosts from "@/components/pages/app/admin/moderation/reported-posts";
import React, { memo } from "react";

export const dynamic = "force-dynamic";

const Page = () => <ReportedPosts />;

export default memo(Page);
