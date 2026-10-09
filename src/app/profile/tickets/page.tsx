"use client";

import ScrollRow from "@/components/ui/scroll-row";
import { constructErrorMessage } from "@/api/functions";
import ErrorContainer from "@/components/ui/error-container";
import TicketCard from "@/components/ticket-design/ticket-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useReceivedTransfers,
  useSentTransfers,
  useUserTickets,
} from "@/hooks/use-user-tickets";
import ReceivedTransfers from "@/components/pages/profile/received-transfers";
import SentTransfers from "@/components/pages/profile/sent-transfers";
import { cn } from "@/lib/utils";
import {
  ETicketStatus,
  IUserTicketType,
  UserTicketDetailsResponseType,
} from "@/lib/types";
import { ROUTES } from "@/lib/variables";
import { TicketIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { memo } from "react";

/** Map API user ticket to the shape expected by TicketCard (IUserTicketType) */
function toUserTicketType(ut: UserTicketDetailsResponseType): IUserTicketType {
  return {
    id: ut.id,
    code: ut.code,
    ticketCode: ut.ticketCode,
    qrCodeValue: ut.qrCodeValue,
    barcodeValue: ut.barcodeValue,
    createdAt: ut.createdAt,
    status: (ut.status as ETicketStatus) ?? ETicketStatus.UN_USED,
    registrationStatus: ut.registrationStatus,
    currentHolderName: ut.currentHolderName,
    currentHolderEmail: ut.currentHolderEmail,
    checkedInAt: ut.checkedInAt,
    scannerEmail: ut.scannerEmail,
    transfer: ut.transfer,
    ticket: {
      id: ut.ticket.id,
      name: ut.ticket.name,
      type: ut.ticket.type,
      link: ut.ticket.link ?? null,
      event: { data: ut.ticket.event },
      price: ut.ticket.price,
      quantity: ut.ticket.quantity,
      sold: ut.ticket.sold,
      available: ut.ticket.available,
      transferable: ut.ticket.transferable,
      isTransferable: ut.ticket.isTransferable,
    },
  };
}

/** Mine (what I can use), Received (sent to me, to accept) and Sent (what I've transferred). */
const TicketTabs: React.FC<{
  active: "mine" | "received" | "sent";
  waiting: number;
  incoming: number;
}> = ({ active, waiting, incoming }) => (
  <ScrollRow>
    <div
      role="tablist"
      aria-label="Tickets"
      className="inline-flex rounded-full bg-muted p-1"
    >
      {(
        [
          {
            value: "mine",
            label: "My tickets",
            href: ROUTES.PROFILE_TICKETS.href,
          },
          {
            value: "received",
            label: incoming ? `Received (${incoming})` : "Received",
            href: `${ROUTES.PROFILE_TICKETS.href}?tab=received`,
          },
          {
            value: "sent",
            label: waiting ? `Sent (${waiting} waiting)` : "Sent",
            href: `${ROUTES.PROFILE_TICKETS.href}?tab=sent`,
          },
        ] as const
      ).map((tab) => (
        <Link
          key={tab.value}
          href={tab.href}
          role="tab"
          aria-selected={active === tab.value}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            active === tab.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  </ScrollRow>
);

const TicketsPage = () => {
  const { data, error, refetch, isLoading } = useUserTickets();
  const { data: sent = [] } = useSentTransfers();
  const searchParams = useSearchParams();
  const passInviteToken = searchParams.get("passInviteToken");
  const tabParam = searchParams.get("tab");
  const activeTab =
    tabParam === "sent" || tabParam === "received" ? tabParam : "mine";
  const { data: received = [] } = useReceivedTransfers();
  const incoming = received.length;
  const waiting = sent.filter(
    (transfer) => transfer.status === "PENDING",
  ).length;
  const tickets = data?.data ?? [];

  if (activeTab !== "mine") {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">My Tickets</h2>
          <TicketTabs
            active={activeTab}
            waiting={waiting}
            incoming={incoming}
          />
        </div>
        {activeTab === "sent" ? <SentTransfers /> : <ReceivedTransfers />}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">My Tickets</h2>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ErrorContainer
          error={constructErrorMessage(
            error as TApiErrorResponseType,
            "Failed to load tickets",
          )}
          retryFunction={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">My Tickets</h2>
        <TicketTabs active="mine" waiting={waiting} incoming={incoming} />
      </div>

      {incoming > 0 && (
        <Link
          href={`${ROUTES.PROFILE_TICKETS.href}?tab=received`}
          className="block rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900 hover:bg-sky-100/70"
        >
          {incoming === 1
            ? "Someone sent you a ticket."
            : `${incoming} tickets were sent to you.`}{" "}
          <span className="font-semibold underline">Accept or decline</span>
        </Link>
      )}

      {waiting > 0 && (
        <Link
          href={`${ROUTES.PROFILE_TICKETS.href}?tab=sent`}
          className="block rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900 hover:bg-amber-100/70"
        >
          {waiting === 1
            ? "1 ticket you sent is waiting to be claimed."
            : `${waiting} tickets you sent are waiting to be claimed.`}{" "}
          <span className="font-semibold underline">See sent tickets</span>
        </Link>
      )}

      {passInviteToken && (
        <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
          <p className="font-semibold">Access pass invite detected</p>
          <p className="mt-1">
            If this pass has already been claimed by your account, it will
            appear below. If it is missing, refresh after signing in with the
            invited email.
          </p>
        </div>
      )}

      {tickets.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <TicketIcon className="size-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">No tickets yet</p>
          <p className="text-sm mt-1">
            Tickets you buy will appear here, separate from orders.
          </p>
          <Link
            href={ROUTES.EXPLORE.href}
            className="inline-block mt-4 text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
          >
            Explore events
          </Link>
        </div>
      )}

      <div className="space-y-8">
        {tickets.map((ut, i) => (
          <TicketCard
            key={ut.id}
            userTicket={toUserTicketType(ut)}
            event={ut.ticket?.event}
            index={i}
            showTransfer={true}
          />
        ))}
      </div>
    </div>
  );
};

export default memo(TicketsPage);
