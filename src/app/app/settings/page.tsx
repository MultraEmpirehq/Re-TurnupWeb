"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import useUserStore from "@/stores/user-store";
import { ShieldCheck } from "lucide-react";
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

  const vendorEmail = userDetails?.email || "";

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
          <Link
            href="/app/settings/vendor-verification"
            className="flex flex-col gap-4 rounded-[1.75rem] border border-cyan-100 bg-cyan-50/70 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition hover:border-cyan-200 hover:bg-cyan-50 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="flex items-start gap-4">
              <span className="rounded-2xl bg-white p-3 text-cyan-700">
                <ShieldCheck className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">
                  Vendor Verification
                </span>
                <span className="mt-2 block text-lg font-bold text-secondary-950">
                  Open verification form
                </span>
                <span className="mt-1 block text-sm leading-6 text-secondary-600">
                  Complete approval details for paid tickets, payouts, and
                  cross-border event hosting.
                </span>
              </span>
            </span>
            <span className="inline-flex h-11 items-center justify-center rounded-2xl bg-secondary-400 px-5 text-sm font-semibold text-white">
              Continue
            </span>
          </Link>

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
                {userDetails ? "Account active" : "Vendor account"}
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

          <div className="rounded-[1.75rem] border border-secondary-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-secondary-400">
              Security
            </p>
            <div className="mt-5 space-y-4">
              <div className="rounded-3xl border border-secondary-100 bg-secondary-50 p-5">
                <p className="text-sm text-secondary-500">Login status</p>
                <p className="mt-3 text-sm text-secondary-700">
                  Keep your account protected by signing out on shared devices
                  and reviewing unusual activity before major event launches.
                </p>
              </div>

              <div className="rounded-3xl border border-secondary-100 bg-secondary-50 p-5">
                <p className="text-sm text-secondary-500">Account access</p>
                <p className="mt-3 text-sm text-secondary-700">
                  Use a strong password, keep your contact email current, and
                  limit scanner or team access to people helping with a specific event.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={handleSave}
                className="rounded-3xl bg-secondary-400 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-secondary-500"
              >
                Save preferences
              </button>
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
