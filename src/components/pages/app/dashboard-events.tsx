"use client";
import { getData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import EmptyContainer from "@/components/ui/empty-container";
import ErrorContainer from "@/components/ui/error-container";
import EventCard, { EventCardSkeleton } from "@/components/ui/event-card";
import { EventDetailsType } from "@/lib/types";
import useUserStore from "@/stores/user-store";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { memo, useMemo } from "react";

const getEvents = async (page: number = 1, userId: string) => {
  const urlParams = new URLSearchParams();
  urlParams.set("page", page?.toString());
  urlParams.set("limit", "12");
  urlParams.set("userId", userId);

  const url = `/events?${urlParams.toString()}`;
  const { data } = await getData<EventDetailsType[]>(url);
  return data;
};

const DashboardEvents: React.FC<{ isEventPage?: boolean }> = ({
  isEventPage = false,
}) => {
  const router = useRouter();
  const userId = useUserStore((state) => state?.userDetails?.id);
  const {
    data,
    error,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["dashboard-events-list", userId],
    queryFn: ({ pageParam }) => getEvents(pageParam, userId || ""),
    enabled: !!userId,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage?.pagination?.nextPage,
  });
  const events = useMemo(
    () => data?.pages?.flatMap((page) => page?.data || []) || [],
    [data],
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-between">
        <h1 className="font-bold text-secondary-800">Events</h1>
      </div>
      {(!data || (data && events?.length > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {!data &&
            Array.from({ length: 6 }).map((_, index) => (
              <EventCardSkeleton key={index} />
            ))}
          {data &&
            events.length > 0 &&
            events.map((event) => <EventCard key={event?.id} {...event} />)}
        </div>
      )}
      {error && !data && (
        <ErrorContainer
          error={constructErrorMessage(
            error as TApiErrorResponseType,
            "Unknown error occurred whilst getting events list",
          )}
          retryFunction={refetch}
        />
      )}
      {data && events.length === 0 && (
        <EmptyContainer
          icon={<CalendarDays className="size-10" />}
          title="No events found"
          description="You haven't created any events yet"
          action={() => router.push("/app/events/create")}
          actionText="Create Event"
        />
      )}
      {hasNextPage && fetchNextPage && isEventPage && (
        <div className="flex flex-row items-center gap-2 justify-between">
          <Button
            disabled={isFetchingNextPage}
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage?.()}
          >
            {isFetchingNextPage ? "Loading..." : "See more"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default memo(DashboardEvents);
