"use client";

import EmptyContainer from "@/components/ui/empty-container";
import { Button } from "@/components/ui/button";
import { useEvents } from "@/hooks/use-event";
import useUserStore from "@/stores/user-store";
import { ArrowLeft, CalendarDays, Mail, MapPin, TicketIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { memo, useMemo } from "react";
import { buildVendorTicketLedger } from "./ticket-ledger-data";

const VendorTicketDetailPage = () => {
  const params = useParams();
  const ticketId = params?.ticketId?.toString() ?? "";
  const userId = useUserStore((state) => state?.userDetails?.id);
  const { data } = useEvents({ limit: 50, userId: userId ?? undefined });

  const events = useMemo(
    () => data?.pages?.flatMap((page) => page?.data ?? []) ?? [],
    [data],
  );

  const tickets = useMemo(() => buildVendorTicketLedger(events), [events]);
  const ticket = useMemo(
    () => tickets.find((entry) => entry.id === ticketId) ?? null,
    [ticketId, tickets],
  );

  if (!ticket) {
    return (
      <div className="space-y-6">
        <Button
          asChild
          variant="outline"
          className="h-11 rounded-2xl border-secondary-200 px-5 text-sm font-semibold text-secondary-950 hover:bg-secondary-50"
        >
          <Link href="/app/tickets">
            <ArrowLeft className="size-4" />
            Back to Tickets
          </Link>
        </Button>
        <div className="rounded-[1.75rem] border border-secondary-100 bg-white px-6 py-10 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <EmptyContainer
            icon={<TicketIcon className="size-10" />}
            title="Ticket record not found"
            description="We couldn't find that vendor ticket record. Return to the ticket ledger and choose another row."
          />
        </div>
      </div>
    );
  }

  const subTotal = ticket.amount;
  const tax = "N0";
  const fee = "N0";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-secondary-400">
            Ticket Ledger
          </p>
          <h1 className="text-[clamp(1.7rem,3vw,2.5rem)] font-bold leading-tight tracking-tight text-secondary-950">
            Ticket transfer details
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-secondary-500">
            Review the ticket owner, transfer state, and the amount tied to this purchase from the vendor dashboard.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="h-11 rounded-2xl border-secondary-200 px-5 text-sm font-semibold text-secondary-950 hover:bg-secondary-50"
        >
          <Link href="/app/tickets">
            <ArrowLeft className="size-4" />
            Back to Tickets
          </Link>
        </Button>
      </div>

      <section className="overflow-hidden rounded-[2rem] border border-secondary-100 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <div className="border-b border-secondary-100 bg-[linear-gradient(180deg,#f8fdff_0%,#ffffff_100%)] px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-secondary-950">
                  #{ticket.id}
                </h2>
                <span
                  className={
                    ticket.status === "Transferred"
                      ? "inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700"
                      : "inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600"
                  }
                >
                  {ticket.status}
                </span>
              </div>
              <p className="text-sm leading-6 text-secondary-500">
                {ticket.status === "Transferred"
                  ? "This ticket has been transferred from the original buyer to a second user."
                  : "This ticket is still with the original buyer and has not been transferred yet."}
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-secondary-100 bg-white px-4 py-3 text-sm shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary-400">
                Issued Date
              </p>
              <p className="mt-1 font-semibold text-secondary-900">{ticket.issueDate}</p>
              {ticket.transferDate && (
                <>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary-400">
                    Transfer Date
                  </p>
                  <p className="mt-1 font-semibold text-secondary-900">{ticket.transferDate}</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
          <div className="space-y-8">
            <div
              className={`grid gap-4 ${
                ticket.status === "Transferred" ? "sm:grid-cols-2" : "sm:grid-cols-1"
              }`}
            >
              <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50/70 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Original Buyer
                </p>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  {ticket.purchaserName}
                </h3>
                <div className="mt-4 space-y-3 text-sm text-slate-500">
                  <p className="flex items-center gap-2">
                    <Mail className="size-4 text-sky-500" />
                    {ticket.purchaserEmail}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="size-4 text-sky-500" />
                    {ticket.venue}
                  </p>
                  <p className="flex items-center gap-2">
                    <CalendarDays className="size-4 text-sky-500" />
                    {ticket.date}
                  </p>
                </div>
              </div>

              {ticket.status === "Transferred" && (
                <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50/70 p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                    Transferred To
                  </p>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">
                    {ticket.transferredToName}
                  </h3>
                  <div className="mt-4 space-y-3 text-sm text-slate-500">
                    <p className="flex items-center gap-2">
                      <Mail className="size-4 text-sky-500" />
                      {ticket.transferredToEmail}
                    </p>
                    <p>
                      The ticket is now assigned to this recipient through the Turnupz transfer flow.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-[1.75rem] border border-secondary-100">
              <div className="border-b border-secondary-100 bg-slate-50/70 px-5 py-4">
                <h3 className="text-lg font-semibold text-secondary-950">Ticket Details</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-sky-400/70 text-xs uppercase tracking-[0.24em] text-secondary-400">
                      <th className="px-5 py-4 font-semibold">Ticket Category</th>
                      <th className="px-5 py-4 font-semibold">Price</th>
                      <th className="px-5 py-4 font-semibold">Qty</th>
                      <th className="px-5 py-4 font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-secondary-100 text-secondary-700">
                      <td className="px-5 py-4 font-medium text-secondary-950">{ticket.category}</td>
                      <td className="px-5 py-4">{ticket.price}</td>
                      <td className="px-5 py-4">{ticket.quantity}</td>
                      <td className="px-5 py-4">{ticket.amount}</td>
                    </tr>
                    {[
                      ["Sub Total", subTotal],
                      ["Tax (0%)", tax],
                      ["Fee", fee],
                      ["Total", ticket.amount],
                    ].map(([label, value]) => (
                      <tr key={label} className="border-b border-secondary-100 last:border-b-0">
                        <td className="px-5 py-3 text-secondary-500" colSpan={3}>
                          {label}
                        </td>
                        <td className="px-5 py-3 font-medium text-secondary-700">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <aside className="rounded-[1.75rem] bg-[#0f172a] p-6 text-white shadow-[0_18px_60px_rgba(15,23,42,0.18)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-200/80">
              Vendor Summary
            </p>
            <h3 className="mt-4 text-2xl font-semibold leading-tight">{ticket.event}</h3>
            <div className="mt-6 space-y-4 text-sm text-slate-300">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <span className="text-slate-400">Ticket ID</span>
                <span className="text-right font-medium text-white">{ticket.id}</span>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <span className="text-slate-400">Current Status</span>
                <span className="text-right font-medium text-white">{ticket.status}</span>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <span className="text-slate-400">Venue</span>
                <span className="text-right font-medium text-white">{ticket.venue}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-400">Table View</span>
                <span className="text-right font-medium text-white">
                  {ticket.status === "Transferred" ? "Buyer + Recipient" : "Buyer only"}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default memo(VendorTicketDetailPage);
