import React, { memo, useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { EventDetailsType } from "@/lib/types";
import { EventCardSkeleton } from "@/components/ui/event-card";
import { useSearchParams } from "next/navigation";
import HappeningNowCard from "@/components/ui/happening-now-card";
import EventCardTwo, {
  EventCardTwoCardLoader,
} from "@/components/ui/event-card-two";
import EmptyContainer from "@/components/ui/empty-container";
import { Button } from "@/components/ui/button";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getData } from "@/api";
import ErrorContainer from "@/components/ui/error-container";
import { constructErrorMessage } from "@/api/functions";

const getEvents = async ({ page = 1 }) => {
  const urlParams = new URLSearchParams();
  urlParams.set("page", page.toString());
  urlParams.set("limit", "10");
  const url = `/events?${urlParams.toString()}`;
  const { data } = await getData<EventDetailsType[]>(`/events?${url}`);
  return data;
};

const EventList = () => {
  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["events"],
    queryFn: ({ pageParam }) => getEvents({ page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage?.pagination?.nextPage,
  });
  const searchParams = useSearchParams();
  const startDate = searchParams?.get("startDate")?.toString();
  const isToday = useMemo(
    () =>
      startDate
        ? new Date(startDate || "")?.toISOString() === new Date()?.toISOString()
        : false,
    [startDate],
  );
  const events = useMemo(
    () => data?.pages?.flatMap((page) => page?.data || []) || [],
    [data],
  );
  const isLoading = useMemo(() => !data, [data]);
  return (
    <div className="w-full">
      {(isLoading || (!isLoading && events && events?.length > 0)) &&
        !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading &&
              Array.from({ length: 6 }).map((_, index) => (
                <EventCardTwoCardLoader key={index} />
              ))}
            {!isLoading &&
              events.length > 0 &&
              events.map((event, index) =>
                isToday ? (
                  <HappeningNowCard key={event?.id || index} {...event} />
                ) : (
                  <EventCardTwo key={event?.id || index} {...event} />
                ),
              )}
          </div>
        )}
      {!isLoading && !error && events && events?.length === 0 && (
        <EmptyContainer
          icon={<CalendarDays className="size-10" />}
          title="No events found"
          description="There is no events available at the moment"
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

export default memo(EventList);
