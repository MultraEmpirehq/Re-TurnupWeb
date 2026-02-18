import React, { memo, useMemo } from "react";
import { CalendarDays } from "lucide-react";
import EmptyContainer from "@/components/ui/empty-container";
import { Button } from "@/components/ui/button";
import { useEvents } from "@/hooks/use-event";
import ErrorContainer from "@/components/ui/error-container";
import { constructErrorMessage } from "@/api/functions";
import EventCard, { EventCardSkeleton } from "@/components/ui/event-card";

interface EventsWithVenueIdListProps {
  venueId?: string;
}

const EventsWithVenueIdList = ({ venueId }: EventsWithVenueIdListProps) => {
  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useEvents(
    { venueId, status: "UPCOMING", limit: 6 },
    { enabled: venueId !== undefined },
  );

  const events = useMemo(
    () => data?.pages?.flatMap((page) => page?.data || []) || [],
    [data],
  );

  const isLoading = useMemo(() => !data, [data]);

  return (
    <div className="w-full">
      {(isLoading || (!isLoading && events?.length > 0)) && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoading &&
            Array.from({ length: 6 }).map((_, index) => (
              <EventCardSkeleton key={index} />
            ))}
          {!isLoading &&
            events.length > 0 &&
            events.map((event, index) => (
              <EventCard key={event?.id || index} {...event} />
            ))}
        </div>
      )}
      {!isLoading && !error && events?.length === 0 && (
        <EmptyContainer
          icon={<CalendarDays className="size-10" />}
          title="No events found"
          description="There are no events at this venue at the moment"
        />
      )}
      {isLoading && error && (
        <ErrorContainer
          error={constructErrorMessage(
            error as TApiErrorResponseType,
            "Unknown error occurred whilst getting events list",
          )}
          retryFunction={refetch}
        />
      )}
      {hasNextPage && fetchNextPage && (
        <div className="flex flex-row items-center gap-2 justify-between">
          <Button
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage?.()}
            variant="outline"
            size="sm"
          >
            {isFetchingNextPage ? "Loading..." : "See more"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default memo(EventsWithVenueIdList);
