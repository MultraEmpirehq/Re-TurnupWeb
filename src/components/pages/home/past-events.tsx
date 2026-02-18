"use client";
import SectionContainer from "@/components/layouts/section-container/section-container";
import EventList from "@/components/ui/event-list";
import React, { memo, useMemo } from "react";
import { useEvents } from "@/hooks/use-event";
import { constructErrorMessage } from "@/api/functions";

const PastEvents = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
    refetch,
  } = useEvents({ limit: 10, status: "PAST" });

  const events = useMemo(
    () =>
      (data?.pages?.flatMap((page) => page?.data || []) || [])?.filter(Boolean),
    [data],
  );

  return (
    <SectionContainer className="space-y-4 py-10 md:py-16">
      <h1 className="text-2xl font-bold">Past Events</h1>
      <EventList
        events={events}
        isLoading={!data}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
        error={
          error
            ? constructErrorMessage(
                error as TApiErrorResponseType,
                "Unknown error occurred whilst getting events list",
              )
            : undefined
        }
        refetch={refetch}
      />
    </SectionContainer>
  );
};

export default memo(PastEvents);
