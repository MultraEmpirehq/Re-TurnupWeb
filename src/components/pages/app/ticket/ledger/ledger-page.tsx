"use client";

import { useEvents } from "@/hooks/use-event";
import { IEventDetailsType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useActingVendor } from "@/stores/workspace-store";
import { ScanLine } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { memo, useMemo, useState } from "react";
import DoorScannersTab from "./door-scanners-tab";
import TicketsTab from "./tickets-tab";

const TABS = [
  { value: "tickets", label: "Tickets" },
  { value: "scanners", label: "Door scanners" },
] as const;

/** The organiser's ticket ledger, and who can scan each event's door. */
const LedgerPage = () => {
  const searchParams = useSearchParams();
  const { vendorId, can } = useActingVendor();
  const [tab, setTab] = useState<(typeof TABS)[number]["value"]>(
    searchParams.get("tab") === "scanners" ? "scanners" : "tickets",
  );
  const { data } = useEvents({ limit: 50, userId: vendorId ?? undefined }, { enabled: !!vendorId });
  const events = useMemo<IEventDetailsType[]>(
    () =>
      (data?.pages?.flatMap((page) => page?.data ?? []) ?? []).sort(
        (a, b) => +new Date(b.date) - +new Date(a.date),
      ),
    [data],
  );
  // A team member only sees the tab they're allowed.
  const tabs = TABS.filter((item) =>
    item.value === "tickets" ? can("SALES_VIEW") : can("SCANNERS_MANAGE"),
  );
  const activeTab = tabs.some((item) => item.value === tab) ? tab : tabs[0]?.value;

  return (
    <div className="space-y-6 pb-16">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-[0.24em] text-secondary-400 uppercase">
            Tickets
          </p>
          <h1 className="text-[clamp(1.9rem,3.4vw,2.6rem)] font-bold leading-tight tracking-tight text-secondary-950">
            Ticket ledger
          </h1>
          <p className="text-sm text-secondary-500">
            Every ticket for your events. Search, filter, check who&apos;s in, and
            export a door list.
          </p>
        </div>
        {can("TICKETS_SCAN") && (
          <Link
            href="/app/scan"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-secondary-900 px-5 text-sm font-semibold text-white hover:bg-secondary-800"
          >
            <ScanLine className="size-4" aria-hidden />
            Scan tickets
          </Link>
        )}
      </header>

      {tabs.length > 1 && (
        <div role="tablist" aria-label="Ledger sections" className="flex gap-6 border-b border-secondary-100">
          {tabs.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={activeTab === item.value}
              onClick={() => setTab(item.value)}
              className={cn(
                "-mb-px border-b-2 pb-3 text-sm font-semibold transition-colors",
                activeTab === item.value
                  ? "border-secondary-900 text-secondary-950"
                  : "border-transparent text-secondary-500 hover:text-secondary-800",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {activeTab === "tickets" && <TicketsTab events={events} />}
      {activeTab === "scanners" && <DoorScannersTab events={events} />}
    </div>
  );
};

export default memo(LedgerPage);
