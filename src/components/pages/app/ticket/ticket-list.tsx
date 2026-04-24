"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEvents } from "@/hooks/use-event";
import useUserStore from "@/stores/user-store";
import { SearchIcon } from "lucide-react";
import Link from "next/link";
import React, { memo, useMemo, useState } from "react";
import {
  buildDemoVendorTicketLedger,
  buildVendorTicketLedger,
  VendorTicketTransferStatus,
} from "./ticket-ledger-data";

type TicketStatusFilter = "All" | VendorTicketTransferStatus;

const statusFilters: TicketStatusFilter[] = [
  "All",
  "Not Transferred",
  "Transferred",
];

const TicketList = () => {
  const userId = useUserStore((state) => state?.userDetails?.id);
  const [activeStatus, setActiveStatus] = useState<TicketStatusFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const { data } = useEvents({ limit: 50, userId: userId ?? undefined });

  const events = useMemo(
    () => data?.pages?.flatMap((page) => page?.data ?? []) ?? [],
    [data],
  );

  const rows = useMemo(() => {
    const eventRows = buildVendorTicketLedger(events);
    return eventRows.length > 0 ? eventRows : buildDemoVendorTicketLedger();
  }, [events]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesStatus =
        activeStatus === "All" ? true : row.status === activeStatus;
      const haystack =
        `${row.id} ${row.purchaserName} ${row.event} ${row.category}`.toLowerCase();
      const matchesSearch = haystack.includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [activeStatus, rows, searchQuery]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex w-fit flex-wrap items-center gap-2 rounded-[1.1rem] bg-secondary-50 p-2">
          {statusFilters.map((filter) => {
            const isActive = filter === activeStatus;
            return (
              <Button
                key={filter}
                type="button"
                onClick={() => setActiveStatus(filter)}
                className={
                  isActive
                    ? "h-10 rounded-[0.9rem] bg-[#0b6f97] px-6 text-base font-semibold text-white hover:bg-[#095d80]"
                    : "h-10 rounded-[0.9rem] bg-transparent px-5 text-base font-semibold text-secondary-950 shadow-none hover:bg-white"
                }
              >
                {filter}
              </Button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 w-full sm:max-w-[22rem]">
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="By name, event etc"
              className="h-11 rounded-[1rem] border-secondary-100 bg-secondary-50 pl-4 pr-11"
            />
            <SearchIcon className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-secondary-400" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-[0.9rem] border-secondary-200 px-4 text-sm font-medium text-secondary-700 hover:bg-secondary-50"
          >
            This Month
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-[0.9rem] border-secondary-200 px-4 text-sm font-medium text-secondary-700 hover:bg-secondary-50"
          >
            Download
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-secondary-100 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="border-b border-secondary-100 bg-white text-left text-secondary-500">
              <tr>
                {[
                  "Ticket ID",
                  "Date",
                  "Buyer",
                  "Event",
                  "Ticket Category",
                  "Price",
                  "Qty",
                  "Amount",
                  "Status",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-4 text-sm font-medium whitespace-nowrap"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-secondary-100 text-secondary-600 transition-colors hover:bg-secondary-50/70"
                >
                  <td className="px-4 py-5 whitespace-nowrap">
                    <Link
                      href={`/app/tickets/${row.id}`}
                      className="block font-medium text-secondary-700"
                    >
                      {row.id}
                    </Link>
                  </td>
                  <td className="px-4 py-5 whitespace-nowrap">
                    <Link href={`/app/tickets/${row.id}`} className="block">
                      {row.date}
                    </Link>
                  </td>
                  <td className="px-4 py-5 whitespace-nowrap">
                    <Link href={`/app/tickets/${row.id}`} className="block">
                      {row.purchaserName}
                    </Link>
                  </td>
                  <td className="px-4 py-5 min-w-[16rem] text-secondary-500">
                    <Link href={`/app/tickets/${row.id}`} className="block">
                      {row.event}
                    </Link>
                  </td>
                  <td className="px-4 py-5 whitespace-nowrap">
                    <Link href={`/app/tickets/${row.id}`} className="block">
                      {row.category}
                    </Link>
                  </td>
                  <td className="px-4 py-5 whitespace-nowrap">
                    <Link href={`/app/tickets/${row.id}`} className="block">
                      {row.price}
                    </Link>
                  </td>
                  <td className="px-4 py-5 whitespace-nowrap">
                    <Link href={`/app/tickets/${row.id}`} className="block">
                      {row.quantity}
                    </Link>
                  </td>
                  <td className="px-4 py-5 whitespace-nowrap">
                    <Link href={`/app/tickets/${row.id}`} className="block">
                      {row.amount}
                    </Link>
                  </td>
                  <td className="px-4 py-5 whitespace-nowrap">
                    <Link href={`/app/tickets/${row.id}`} className="block">
                      <span
                        className={
                          row.status === "Transferred"
                            ? "font-medium text-sky-600"
                            : "font-medium text-slate-500"
                        }
                      >
                        {row.status}
                      </span>
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-14 text-center text-sm text-secondary-500"
                  >
                    No ticket records match this filter yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 px-4 py-5 text-secondary-500 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm">
            <span>Showing</span>
            <span className="rounded-full bg-[#0b6f97] px-4 py-1.5 text-sm font-semibold text-white">
              {filteredRows.length}
            </span>
            <span>Of {rows.length || 0}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-secondary-400">{"<"}</span>
            <span className="text-secondary-950">1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
            <span className="text-secondary-400">{"..."}</span>
            <span className="text-secondary-400">{">"}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default memo(TicketList);
