"use client";

import DevicesCard from "@/components/account/devices-card";
import NotificationPreferencesCard from "@/components/account/notification-preferences-card";
import PrivacyCard from "@/components/account/privacy-card";
import ChangePasswordForm from "@/components/pages/profile/change-password-form";
import { ROUTES } from "@/lib/variables";
import Link from "next/link";
import React, { memo } from "react";

/** Notifications, privacy, signed-in devices and password, for any account. */
const SettingsPage = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-lg font-semibold">Settings</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        What you&apos;re notified about, who can reach you, where you&apos;re signed in, and your password. Your photo
        and details are in{" "}
        <Link href={ROUTES.PROFILE_EDIT.href} className="font-semibold text-primary hover:underline">
          Edit profile
        </Link>
        .
      </p>
    </div>
    <NotificationPreferencesCard />
    <PrivacyCard />
    <DevicesCard />
    <ChangePasswordForm />
  </div>
);

export default memo(SettingsPage);
