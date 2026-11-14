"use client";

import { Button } from "@/components/ui/button";
import { VendorVerificationForm } from "@/components/pages/app/vendor-verification";
import Link from "next/link";
import React, { memo } from "react";

const VendorVerificationPage = () => {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Host events on Turnupz
          </h1>
          <p className="hidden max-w-2xl text-sm text-muted-foreground sm:block">
            Host free events with a few details and start straight away, or
            verify your ID and bank to sell tickets and get paid.
          </p>
        </div>

        <Button
          asChild
          variant="outline"
          className="h-10 shrink-0 rounded-full border-secondary-200 px-4 text-sm font-semibold text-secondary-950 hover:bg-secondary-50"
        >
          <Link href="/app/settings">Back to Settings</Link>
        </Button>
      </div>

      <VendorVerificationForm />
    </div>
  );
};

export default memo(VendorVerificationPage);
