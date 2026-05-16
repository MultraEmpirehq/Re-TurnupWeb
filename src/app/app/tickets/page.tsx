import TicketList from "@/components/pages/app/ticket/ticket-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React, { memo } from "react";

export const dynamic = "force-dynamic";

const TicketPage = () => {
  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-secondary-400">
            Ticket Ledger
          </p>
          <h1 className="text-[clamp(1.8rem,3.2vw,2.7rem)] font-bold leading-[0.98] tracking-tight text-secondary-950">
            Track ticket records and attendee flow
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-secondary-500 sm:text-base">
            Review ticket activity, manage scanner access, validate entry, and
            track attendance across your events.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="h-12 rounded-2xl border-secondary-200 px-5 text-sm font-semibold text-secondary-950 hover:bg-secondary-50"
        >
          <Link href="/app">Back to Dashboard</Link>
        </Button>
      </section>
      <TicketList />
    </div>
  );
};

export default memo(TicketPage);
