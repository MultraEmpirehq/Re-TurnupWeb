"use client";

import ProfileDetailsForm from "@/components/pages/profile/profile-details-form";
import React, { memo } from "react";

// Same form as the dashboard profile, so both places edit the same details.
const ProfilePage = () => <ProfileDetailsForm />;

export default memo(ProfilePage);
