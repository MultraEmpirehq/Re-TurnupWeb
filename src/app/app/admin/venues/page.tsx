import AdminVenues from "@/components/pages/app/venues/admin-venues";
import React, { memo } from "react";

export const dynamic = "force-dynamic";

const Page = () => <AdminVenues />;

export default memo(Page);
