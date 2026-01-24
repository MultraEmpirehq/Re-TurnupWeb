"use client";
import { getData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import SectionContainer from "@/components/layouts/section-container/section-container";
import EventList from "@/components/ui/event-list";
import { EventDetailsType } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import React, { memo, useMemo } from "react";

const getTrendingEvents = async (page: number = 1) => {
  const urlParams = new URLSearchParams();
  urlParams.set("page", page.toString());
  urlParams.set("limit", "10");
  const url = `/events?${urlParams.toString()}`;
  const { data } = await getData<EventDetailsType[]>(`/events?${url}`);
  return data;
};

const TrendingEvents = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["trending-events"],
    queryFn: ({ pageParam = 1 }) => getTrendingEvents(pageParam),
    getNextPageParam: (lastPage) => lastPage?.pagination?.nextPage,
    initialPageParam: 1,
  });
  const events = useMemo(
    () =>
      (data?.pages.flatMap((page) => page?.data || []) || [])?.filter(Boolean),
    [data],
  );
  return (
    <SectionContainer className="space-y-4 py-10 md:py-16">
      <h1 className="text-2xl font-bold">Trending Events</h1>
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

export default memo(TrendingEvents);
