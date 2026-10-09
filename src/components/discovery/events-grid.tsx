"use client";

import { Button } from "@/components/ui/button";
import { EventCardSkeleton } from "@/components/ui/event-card";
import { useEvents } from "@/hooks/use-event";
import React, { memo, useMemo } from "react";
import TicketCard from "../pages/home/landing/ticket-card";

type TEventsGridParams = Parameters<typeof useEvents>[0];

/** A grid of events for a filter (a performer's, a planner's), with Load more. */
const EventsGrid: React.FC<{
  params: TEventsGridParams;
  emptyText: string;
}> = ({ params, emptyText }) => {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useEvents({ limit: 12, ...params });
  const events = useMemo(
    () =>
      (data?.pages ?? []).flatMap((page) => page?.data ?? []).filter(Boolean),
    [data],
  );

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <EventCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return <p className="text-sm text-secondary-500">{emptyText}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <TicketCard key={event.id} event={event} />
        ))}
      </div>
      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            className="rounded-full"
            loading={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
};

export default memo(EventsGrid);
