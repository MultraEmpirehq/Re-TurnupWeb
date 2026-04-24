"use client";

import { constructErrorMessage } from "@/api/functions";
import ErrorContainer from "@/components/ui/error-container";
import TicketCard from "@/components/ticket-design/ticket-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserTickets } from "@/hooks/use-user-tickets";
import {
  ETicketStatus,
  IUserTicketType,
  UserTicketDetailsResponseType,
} from "@/lib/types";
import { ROUTES } from "@/lib/variables";
import { TicketIcon } from "lucide-react";
import Link from "next/link";
import React, { memo } from "react";

/** Map API user ticket to the shape expected by TicketCard (IUserTicketType) */
function toUserTicketType(ut: UserTicketDetailsResponseType): IUserTicketType {
  return {
    id: ut.id,
    code: ut.code,
    createdAt: ut.createdAt,
    status: (ut.status as ETicketStatus) ?? ETicketStatus.UN_USED,
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
    },
  };
}

const TicketsPage = () => {
  const { data, error, refetch, isLoading } = useUserTickets();
  const tickets = data?.data ?? [];

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
      <h2 className="text-lg font-semibold">My Tickets</h2>

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
