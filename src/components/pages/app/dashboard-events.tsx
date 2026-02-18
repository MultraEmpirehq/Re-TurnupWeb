"use client";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import EmptyContainer from "@/components/ui/empty-container";
import ErrorContainer from "@/components/ui/error-container";
import EventCard, { EventCardSkeleton } from "@/components/ui/event-card";
import { useEvents } from "@/hooks/use-event";
import useUserStore from "@/stores/user-store";
import { CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { memo, useMemo } from "react";

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
  } = useEvents(
    { limit: 12, userId: userId ?? undefined },
    { enabled: !!userId },
  );

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
            events.map((event) => (
              <EventCard isDashboard key={event?.id} {...event} />
            ))}
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
