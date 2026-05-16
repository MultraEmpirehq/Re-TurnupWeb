"use client";

import { Button } from "@/components/ui/button";
import { VendorVerificationForm } from "@/components/pages/app/vendor-verification";
import Link from "next/link";
import React, { memo } from "react";

const VendorVerificationPage = () => {
  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="text-[0.75rem] font-bold uppercase tracking-[0.2em] text-secondary-400">
            Vendor Verification
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-secondary-950 md:text-5xl">
            Complete your vendor approval
          </h1>
          <p className="mt-3 max-w-2xl text-secondary-500">
            Submit identity, payout, and hosting details so Turnupz can review
            your account for publishing, paid tickets, and payouts.
          </p>
        </div>

        <Button
          asChild
          variant="outline"
          className="h-12 rounded-2xl border-secondary-200 px-5 text-sm font-semibold text-secondary-950 hover:bg-secondary-50"
        >
          <Link href="/app/settings">Back to Settings</Link>
        </Button>
      </div>

      <VendorVerificationForm />
    </div>
  );
};

export default memo(VendorVerificationPage);
