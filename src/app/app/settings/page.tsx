"use client";

import DevicesCard from "@/components/account/devices-card";
import NotificationPreferencesCard from "@/components/account/notification-preferences-card";
import OrganiserNameCard from "@/components/account/organiser-name-card";
import PrivacyCard from "@/components/account/privacy-card";
import TaxDetailsCard from "@/components/account/tax-details-card";
import ChangePasswordForm from "@/components/pages/profile/change-password-form";
import { ROUTES } from "@/lib/variables";
import useUserStore, { EUserRoles } from "@/stores/user-store";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import React, { memo } from "react";

/**
 * Account settings in the dashboard, for organisers and admins: the same
 * notification, device and password settings attendees have, plus vendor
 * verification for organisers.
 */
const SettingsPage = () => {
  const role = useUserStore((state) => state.userDetails?.role);
  const isVendor = role === EUserRoles.VENDOR;
  // Admins are staff: no attendee privacy or notification choices, just sign-in.
  const isAdmin = role === EUserRoles.ADMIN;

  return (
    <div className="space-y-8 pb-20">
      <div className="space-y-2">
        <span className="text-[0.75rem] font-bold tracking-[0.2em] text-secondary-400 uppercase">
          Settings
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-secondary-950">
          Your account
        </h1>
        <p className="max-w-2xl text-secondary-500">
          {isAdmin
            ? "Check where you're signed in and change your password."
            : "Choose what you're notified about and who can reach you, check where you're signed in, and change your password."}
        </p>
      </div>

      {isVendor && (
        <Link
          href={ROUTES.VENDOR_VERIFICATION.href}
          className="flex flex-col gap-4 rounded-[1.5rem] border border-primary-100 bg-primary-50/70 p-6 transition hover:border-primary-200 hover:bg-primary-50 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="flex items-start gap-4">
            <span className="rounded-2xl bg-white p-3 text-primary-700">
              <ShieldCheck className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-bold tracking-[0.18em] text-primary-700 uppercase">
                Vendor verification
              </span>
              <span className="mt-1 block text-sm leading-6 text-secondary-600">
                Approval details for paid tickets, payouts and cross-border
                events.
              </span>
            </span>
          </span>
          <span className="inline-flex h-11 items-center justify-center rounded-2xl bg-secondary-400 px-5 text-sm font-semibold text-white">
            Open
          </span>
        </Link>
      )}

      {isVendor && <TaxDetailsCard />}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {isVendor && <OrganiserNameCard />}
          {!isAdmin && <NotificationPreferencesCard />}
          {!isAdmin && <PrivacyCard />}
        </div>
        <div className="space-y-6">
          <DevicesCard />
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
};

export default memo(SettingsPage);
