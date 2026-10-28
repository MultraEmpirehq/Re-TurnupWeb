"use client";

import ScrollRow from "@/components/ui/scroll-row";
import { constructErrorMessage } from "@/api/functions";
import ErrorContainer from "@/components/ui/error-container";
import {
  EventPassCard,
  PassViewer,
  TEventTickets,
  colourOf,
  groupByEvent,
} from "@/components/ticket-design/ticket-wallet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useReceivedTransfers,
  useSentTransfers,
  useUserTickets,
} from "@/hooks/use-user-tickets";
import ReceivedTransfers from "@/components/pages/profile/received-transfers";
import SentTransfers from "@/components/pages/profile/sent-transfers";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/variables";
import { TicketIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { memo, useCallback, useMemo, useState } from "react";

type TTab = "upcoming" | "past" | "received" | "sent";

/** The page colour behind the cards (the tear's notches are cut in it). */
const PAGE_BACKGROUND = "#ffffff";

/**
 * Upcoming and Past (your tickets, one card per event, as on the app),
 * Received (sent to you, to accept) and Sent (what you've transferred).
 */
const TicketTabs: React.FC<{
  active: TTab;
  upcoming?: number;
  past?: number;
  waiting: number;
  incoming: number;
}> = ({ active, upcoming, past, waiting, incoming }) => (
  <ScrollRow>
    <div
      role="tablist"
      aria-label="Tickets"
      className="inline-flex rounded-full bg-muted p-1"
    >
      {(
        [
          {
            value: "upcoming",
            label: upcoming !== undefined ? `Upcoming (${upcoming})` : "Upcoming",
            href: ROUTES.PROFILE_TICKETS.href,
          },
          {
            value: "past",
            label: past !== undefined ? `Past (${past})` : "Past",
            href: `${ROUTES.PROFILE_TICKETS.href}?tab=past`,
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
  const activeTab: TTab =
    tabParam === "sent" || tabParam === "received" || tabParam === "past"
      ? tabParam
      : "upcoming";
  const { data: received = [] } = useReceivedTransfers();
  const incoming = received.length;
  const waiting = sent.filter(
    (transfer) => transfer.status === "PENDING",
  ).length;
  const tickets = useMemo(() => data?.data ?? [], [data]);
  const { upcoming, past } = useMemo(() => groupByEvent(tickets), [tickets]);
  const list = activeTab === "past" ? past : upcoming;
  const [open, setOpen] = useState<TEventTickets | null>(null);
  const close = useCallback(() => setOpen(null), []);

  if (activeTab === "received" || activeTab === "sent") {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">My Tickets</h2>
          <TicketTabs
            active={activeTab}
            upcoming={isLoading ? undefined : upcoming.length}
            past={isLoading ? undefined : past.length}
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
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-3xl" />
          ))}
        </div>
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
        <TicketTabs
          active={activeTab}
          upcoming={upcoming.length}
          past={past.length}
          waiting={waiting}
          incoming={incoming}
        />
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
          className="block rounded-2xl border border-secondary-100 bg-secondary-50 px-4 py-3 text-sm text-secondary-900 hover:bg-secondary-100/70"
        >
          {waiting === 1
            ? "1 ticket you sent is waiting to be claimed."
            : `${waiting} tickets you sent are waiting to be claimed.`}{" "}
          <span className="font-semibold underline">See sent tickets</span>
        </Link>
      )}

      {passInviteToken && (
        <div className="rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-900">
          <p className="font-semibold">Access pass invite detected</p>
          <p className="mt-1">
            If this pass has already been claimed by your account, it will
            appear below. If it is missing, refresh after signing in with the
            invited email.
          </p>
        </div>
      )}

      {list.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <TicketIcon className="size-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">
            {activeTab === "past" ? "No past events" : "No upcoming tickets"}
          </p>
          <p className="text-sm mt-1">
            {activeTab === "past"
              ? "Events you've been to will show here."
              : "Tickets you buy or register for show up here."}
          </p>
          {activeTab !== "past" && (
            <Link
              href={ROUTES.EXPLORE.href}
              className="inline-block mt-4 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              Explore events
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((group, index) => (
          <EventPassCard
            key={group.event.id}
            group={group}
            colour={colourOf(group, index)}
            background={PAGE_BACKGROUND}
            onOpen={() => setOpen(group)}
          />
        ))}
      </div>

      <PassViewer
        group={open}
        colour={open ? colourOf(open, list.indexOf(open)) : "#0b1d2a"}
        onClose={close}
      />
    </div>
  );
};

export default memo(TicketsPage);
