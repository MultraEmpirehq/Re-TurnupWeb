import CatalogueReviews from "@/components/pages/app/admin/moderation/catalogue-reviews";
import React, { memo } from "react";

export const dynamic = "force-dynamic";

const Page = () => <CatalogueReviews />;

export default memo(Page);
