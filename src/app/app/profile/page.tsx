"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useUserStore from "@/stores/user-store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React, { memo, useEffect, useMemo, useState } from "react";

const ProfilePage = () => {
  const router = useRouter();
  const userDetails = useUserStore((state) => state.userDetails);
  const setUserDetails = useUserStore((state) => state.setUserDetails);
  const clearStore = useUserStore((state) => state.clearStore);
  const [profileMessage, setProfileMessage] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [vendorEmail, setVendorEmail] = useState("");

  useEffect(() => {
    const fullName =
      userDetails?.name ||
      [userDetails?.firstName, userDetails?.lastName].filter(Boolean).join(" ") ||
      "Turnupz Vendor";

    setVendorName(fullName);
    setVendorEmail(userDetails?.email || "");
  }, [userDetails]);

  const initials = useMemo(() => {
    const first = userDetails?.firstName?.charAt(0) || vendorName.charAt(0) || "T";
    const last = userDetails?.lastName?.charAt(0) || vendorName.split(" ")[1]?.charAt(0) || "Z";
    return `${first}${last}`.toUpperCase();
  }, [userDetails, vendorName]);

  const handleSave = () => {
    const [firstName, ...rest] = vendorName.trim().split(" ");
    const lastName = rest.join(" ").trim();

    if (userDetails) {
      setUserDetails({
        ...userDetails,
        name: vendorName.trim(),
        firstName: firstName || userDetails.firstName,
        lastName: lastName || userDetails.lastName,
        email: vendorEmail.trim(),
      });
    }

    setProfileMessage("Your vendor profile details have been updated.");
  };

  const handleLogout = () => {
    clearStore();
    router.push("/auth");
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="text-[0.75rem] uppercase tracking-[0.2em] font-bold text-secondary-400">
            Vendor Profile
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-secondary-950 md:text-5xl">
            Manage your vendor identity
          </h1>
          <p className="mt-3 max-w-2xl text-secondary-500">
            Review your vendor account details, activity snapshot, and profile information in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            asChild
            variant="outline"
            className="h-12 rounded-2xl border-secondary-200 px-5 text-sm font-semibold text-secondary-950 hover:bg-secondary-50"
          >
            <Link href="/app">Back to Dashboard</Link>
          </Button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-2xl border border-secondary-200 bg-white px-5 py-3 text-sm font-semibold text-secondary-700 transition-all hover:bg-secondary-50"
          >
            Logout
          </button>
        </div>
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
              <div className="flex items-center gap-4">
                <div className="flex size-16 items-center justify-center rounded-[1.5rem] bg-secondary-800 text-lg font-semibold text-white shadow-sm shadow-secondary-800/25">
                  {initials}
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-secondary-400 font-bold">
                    Vendor identity
                  </p>
                  <h2 className="mt-3 text-2xl font-bold text-secondary-950">
                    {vendorName}
                  </h2>
                  <p className="mt-2 text-sm text-secondary-500">{vendorEmail}</p>
                </div>
              </div>
              <div className="rounded-3xl bg-secondary-50 px-4 py-3 text-sm text-secondary-600">
                Active vendor account
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-secondary-100 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <p className="text-sm uppercase tracking-[0.2em] text-secondary-400 font-bold">
              Activity summary
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-secondary-100 bg-secondary-50 p-5">
                <p className="text-sm text-secondary-500">New orders</p>
                <p className="mt-3 text-3xl font-bold text-secondary-950">12</p>
              </div>
              <div className="rounded-3xl border border-secondary-100 bg-secondary-50 p-5">
                <p className="text-sm text-secondary-500">Messages</p>
                <p className="mt-3 text-3xl font-bold text-secondary-950">8</p>
              </div>
              <div className="rounded-3xl border border-secondary-100 bg-secondary-50 p-5">
                <p className="text-sm text-secondary-500">Pending updates</p>
                <p className="mt-3 text-3xl font-bold text-secondary-950">3</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-secondary-100 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-secondary-400 font-bold">
                    Profile details
                  </p>
                  <h2 className="text-2xl font-bold text-secondary-950">
                    Edit your account information
                  </h2>
                </div>
                <p className="max-w-3xl text-secondary-600">
                  Update the display name and email used across bookings, analytics, and vendor communication.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSave}
                className="rounded-3xl bg-secondary-400 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-secondary-500"
              >
                Save changes
              </button>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-secondary-100 bg-secondary-50 p-5">
                <p className="text-sm text-secondary-500">Display name</p>
                <Input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="mt-3 h-12 rounded-3xl border-secondary-200 bg-white px-4 text-sm text-secondary-900 outline-none focus-visible:ring-secondary-200"
                />
              </div>

              <div className="rounded-3xl border border-secondary-100 bg-secondary-50 p-5">
                <p className="text-sm text-secondary-500">Email address</p>
                <Input
                  type="email"
                  value={vendorEmail}
                  onChange={(e) => setVendorEmail(e.target.value)}
                  className="mt-3 h-12 rounded-3xl border-secondary-200 bg-white px-4 text-sm text-secondary-900 outline-none focus-visible:ring-secondary-200"
                />
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-secondary-100 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <p className="text-sm uppercase tracking-[0.2em] text-secondary-400 font-bold">
              Your vendor activities
            </p>
            <div className="mt-6 space-y-4 text-sm leading-6 text-secondary-600">
              <p>
                Keep an eye on ticket movement, listing updates, and incoming attendee interest from your published events.
              </p>
              <p>
                Use the vendor dashboard navigation to view metrics, manage event listings, and review attendee activity.
              </p>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[1.75rem] border border-secondary-100 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <p className="text-sm uppercase tracking-[0.2em] text-secondary-400 font-bold">
              Vendor details
            </p>
            <div className="mt-6 space-y-3 text-sm text-secondary-600">
              <p>
                <span className="font-semibold text-secondary-950">Account type:</span> Premium Vendor
              </p>
              <p>
                <span className="font-semibold text-secondary-950">Listings:</span> Publish and manage event experiences on Turnupz.
              </p>
              <p>
                <span className="font-semibold text-secondary-950">Support:</span> Use the FAQ or contact support for vendor help.
              </p>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-secondary-100 bg-secondary-50 p-6 text-sm text-secondary-500 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <p className="font-semibold text-secondary-950">Need help?</p>
            <p className="mt-3">
              Visit the FAQ page or reach out to support if you need help managing your vendor account.
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

export default memo(ProfilePage);
