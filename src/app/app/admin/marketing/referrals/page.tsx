import ReferralsHub from "@/components/pages/app/admin/growth/referrals-hub";
import React, { memo, Suspense } from "react";

export const dynamic = "force-dynamic";

/** Friend invites and influencer codes, in one place. */
const Page = () => (
  <Suspense>
    <ReferralsHub />
  </Suspense>
);

export default memo(Page);
