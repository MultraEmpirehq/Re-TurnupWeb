"use client";

import FaqList from "@/components/pages/faq/faq-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React, { memo } from "react";

const FaqPage = () => {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,rgba(244,248,255,0.92)_0%,rgba(255,255,255,1)_30%)] px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-secondary-400">
              FAQs
            </p>
            <h1 className="text-[clamp(1.8rem,3.2vw,2.7rem)] font-bold leading-[0.98] tracking-tight text-secondary-950">
              Frequently asked questions
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-secondary-500 sm:text-base">
              Answers about using Turnupz, buying tickets, and vendor verification
              levels, paid publishing, cross-border events, currencies and payouts.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="h-12 rounded-2xl border-secondary-200 px-5 text-sm font-semibold text-secondary-950 hover:bg-secondary-50"
          >
            <Link href="/app/settings/vendor-verification">
              Start Verification
            </Link>
          </Button>
        </div>

        <FaqList />
      </div>
    </main>
  );
};

export default memo(FaqPage);
