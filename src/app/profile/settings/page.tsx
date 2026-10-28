"use client";

import DevicesCard from "@/components/account/devices-card";
import NotificationPreferencesCard from "@/components/account/notification-preferences-card";
import PrivacyCard from "@/components/account/privacy-card";
import ChangePasswordForm from "@/components/pages/profile/change-password-form";
import React, { memo } from "react";

/** Notifications, privacy, signed-in devices and password, for any account. */
const SettingsPage = () => (
  <div className="space-y-6">
    <NotificationPreferencesCard />
    <PrivacyCard />
    <DevicesCard />
    <ChangePasswordForm />
  </div>
);

export default memo(SettingsPage);
