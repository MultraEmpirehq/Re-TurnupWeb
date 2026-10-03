"use client";

import ChangePasswordForm from "@/components/pages/profile/change-password-form";
import ProfileDetailsForm from "@/components/pages/profile/profile-details-form";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/variables";
import useUserStore from "@/stores/user-store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { memo } from "react";

const ProfilePage = () => {
  const router = useRouter();
  const clearStore = useUserStore((state) => state.clearStore);

  const handleLogout = () => {
    clearStore();
    router.push(ROUTES.LOGIN.href);
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="text-[0.75rem] font-bold tracking-[0.2em] text-secondary-400 uppercase">
            Profile
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-secondary-950 md:text-5xl">
            Manage your account
          </h1>
          <p className="mt-3 max-w-2xl text-secondary-500">
            Update your photo, personal details and password in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            asChild
            variant="outline"
            className="h-12 rounded-2xl border-secondary-200 px-5 text-sm font-semibold text-secondary-950 hover:bg-secondary-50"
          >
            <Link href={ROUTES.DASHBOARD.href}>Back to Dashboard</Link>
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

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <ProfileDetailsForm />
          <ChangePasswordForm />
        </div>

        <aside className="space-y-6">
          <div className="rounded-[1.75rem] border border-secondary-100 bg-secondary-50 p-6 text-sm text-secondary-500 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <p className="font-semibold text-secondary-950">Need help?</p>
            <p className="mt-3">
              Visit the FAQ page or reach out to support if you need help managing
              your account.
            </p>
            <Link
              href={ROUTES.FAQS.href}
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
