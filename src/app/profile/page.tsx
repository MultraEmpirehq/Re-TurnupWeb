"use client";

import ProfileCard from "@/components/pages/profile/overview/profile-card";
import ProfileTabs from "@/components/pages/profile/overview/profile-tabs";
import React, { memo } from "react";

/**
 * Your profile, as on the app: who you are on the left (kept in view on wide
 * screens), your events on the right. Editing the details is its own page.
 */
const ProfilePage = () => (
  <div className="@container">
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 @4xl:grid-cols-[360px_minmax(0,1fr)] @6xl:grid-cols-[380px_minmax(0,1fr)]">
      <div className="@4xl:sticky @4xl:top-24">
        <ProfileCard />
      </div>
      <div className="@container min-w-0">
        <ProfileTabs />
      </div>
    </div>
  </div>
);

export default memo(ProfilePage);
