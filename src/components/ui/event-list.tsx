import React, { memo } from "react";
import EventCard, {
  EventCardComponentProps,
  EventCardSkeleton,
} from "./event-card";
import EmptyContainer from "./empty-container";
import { Button } from "./button";

export interface EventListProps {
  events: EventCardComponentProps[];
  isLoading?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  isFetchingNextPage?: boolean;
}

const EventList: React.FC<EventListProps> = ({
  events,
  isLoading,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
}) => {
  return (
    <div className="w-full">
      {(isLoading || (!isLoading && events && events.length > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      {!isLoading && events && events.length === 0 && (
        <EmptyContainer
          title="No events found"
          description="There is no events available at the moment"
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

export default memo(EventList);
