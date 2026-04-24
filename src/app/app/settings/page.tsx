"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import useUserStore from "@/stores/user-store";
import Link from "next/link";
import React, { memo, useMemo, useState } from "react";

const SettingsPage = () => {
  const userDetails = useUserStore((state) => state.userDetails);
  const [profileMessage, setProfileMessage] = useState("");
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [bookingAlerts, setBookingAlerts] = useState(true);
  const [listingAlerts, setListingAlerts] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  const vendorName = useMemo(() => {
    if (!userDetails) return "Turnupz Vendor";
    return (
      userDetails.name ||
      [userDetails.firstName, userDetails.lastName].filter(Boolean).join(" ") ||
      "Turnupz Vendor"
    );
  }, [userDetails]);

  const vendorEmail = userDetails?.email || "vendor@turnupz.dev";

  const handleSave = () => {
    setProfileMessage("Your vendor settings have been updated.");
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="text-[0.75rem] uppercase tracking-[0.2em] font-bold text-secondary-400">
            Vendor Settings
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-secondary-950 md:text-5xl">
            Control your vendor account preferences
          </h1>
          <p className="mt-3 max-w-2xl text-secondary-500">
            Manage notifications, security preferences, and communication settings for your
            Turnupz vendor account.
          </p>
        </div>

        <Button
          asChild
          variant="outline"
          className="h-12 rounded-2xl border-secondary-200 px-5 text-sm font-semibold text-secondary-950 hover:bg-secondary-50"
        >
          <Link href="/app">Back to Dashboard</Link>
        </Button>
      </div>

      {profileMessage && (
        <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-700">
          {profileMessage}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-secondary-100 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-secondary-400 font-bold">
                  Account settings
                </p>
                <h2 className="mt-3 text-2xl font-bold text-secondary-950">
                  {vendorName}
                </h2>
                <p className="mt-2 text-sm text-secondary-500">{vendorEmail}</p>
              </div>
              <div className="rounded-3xl bg-secondary-50 px-4 py-3 text-sm text-secondary-600">
                {userDetails ? "Signed in" : "Frontend preview"}
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-secondary-100 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <p className="text-sm uppercase tracking-[0.2em] text-secondary-400 font-bold">
              Notification preferences
            </p>

            <div className="mt-6 space-y-4">
              {[
                {
                  title: "Email updates",
                  description:
                    "Receive updates for major activity on your vendor account.",
                  checked: emailUpdates,
                  onCheckedChange: setEmailUpdates,
                },
                {
                  title: "Booking alerts",
                  description:
                    "Get notified when customers place new ticket purchases or bookings.",
                  checked: bookingAlerts,
                  onCheckedChange: setBookingAlerts,
                },
                {
                  title: "Listing alerts",
                  description:
                    "Receive updates about event changes, reach, and engagement.",
                  checked: listingAlerts,
                  onCheckedChange: setListingAlerts,
                },
                {
                  title: "Marketing emails",
                  description:
                    "Receive tips, launch updates, and platform feature announcements.",
                  checked: marketingEmails,
                  onCheckedChange: setMarketingEmails,
                },
              ].map((item) => (
                <label
                  key={item.title}
                  className="flex items-center justify-between gap-4 rounded-3xl border border-secondary-100 bg-secondary-50 p-5"
                >
                  <div>
                    <p className="font-semibold text-secondary-950">{item.title}</p>
                    <p className="mt-1 text-sm text-secondary-500">{item.description}</p>
                  </div>
                  <Switch
                    checked={item.checked}
                    onCheckedChange={item.onCheckedChange}
                    className="data-[state=checked]:bg-secondary-400"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-secondary-100 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <p className="text-sm uppercase tracking-[0.2em] text-secondary-400 font-bold">
              Security
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-secondary-100 bg-secondary-50 p-5">
                <p className="text-sm text-secondary-500">Login status</p>
                <p className="mt-3 text-sm text-secondary-700">
                  Your vendor account is currently running in frontend preview mode while
                  backend account controls are being connected.
                </p>
              </div>

              <div className="rounded-3xl border border-secondary-100 bg-secondary-50 p-5">
                <p className="text-sm text-secondary-500">Account access</p>
                <p className="mt-3 text-sm text-secondary-700">
                  Settings are safe to design now. Real persistence can be connected once the
                  backend settings endpoints are ready.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleSave}
                className="rounded-3xl bg-secondary-400 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-secondary-500"
              >
                Save preferences
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[1.75rem] border border-secondary-100 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <p className="text-sm uppercase tracking-[0.2em] text-secondary-400 font-bold">
              Settings overview
            </p>
            <div className="mt-6 space-y-3 text-sm text-secondary-600">
              <p>
                <span className="font-semibold text-secondary-950">Email:</span>{" "}
                {emailUpdates ? "Enabled" : "Disabled"}
              </p>
              <p>
                <span className="font-semibold text-secondary-950">Booking alerts:</span>{" "}
                {bookingAlerts ? "Enabled" : "Disabled"}
              </p>
              <p>
                <span className="font-semibold text-secondary-950">Listing alerts:</span>{" "}
                {listingAlerts ? "Enabled" : "Disabled"}
              </p>
              <p>
                <span className="font-semibold text-secondary-950">Marketing:</span>{" "}
                {marketingEmails ? "Enabled" : "Disabled"}
              </p>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-secondary-100 bg-secondary-50 p-6 text-sm text-secondary-500 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <p className="font-semibold text-secondary-950">Need help?</p>
            <p className="mt-3">
              Visit the FAQ page or contact support if you need help with your vendor account
              settings.
            </p>
            <Link
              href="/faqs"
              className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-secondary-950 transition-all hover:bg-secondary-100"
            >
              Go to FAQ
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default memo(SettingsPage);
