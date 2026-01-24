import { getData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import EmptyContainer from "@/components/ui/empty-container";
import ErrorContainer from "@/components/ui/error-container";
import VenueCard, { VenueCardSkeleton } from "@/components/ui/venue-card";
import { VenueDetailsType } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import React, { memo, useMemo } from "react";

const getVenues = async (page = 1) => {
  const urlSearchParams = new URLSearchParams();
  urlSearchParams.set("page", page?.toString());
  const url = urlSearchParams?.toString();
  const { data } = await getData<VenueDetailsType[]>(`/venues?${url}`);
  return data;
};

const VenueContent = () => {
  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useInfiniteQuery({
    queryFn: ({ pageParam }) => getVenues(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage?.pagination?.nextPage,
    queryKey: ["venues"],
  });
  const isLoading = useMemo(() => !data, [data]);
  const venues = useMemo(() => {
    return data?.pages?.flatMap((page) => page?.data || []) || [];
  }, [data]);
  return (
    <div>
      {(isLoading || (!isLoading && venues && venues.length > 0)) && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading &&
            Array.from({ length: 6 }).map((_, index) => (
              <VenueCardSkeleton key={index} />
            ))}
          {!isLoading &&
            venues.length > 0 &&
            venues.map((venue, index) => (
              <VenueCard key={venue?.id || index} {...venue} />
            ))}
        </div>
      )}
      {!isLoading && !error && venues && venues.length === 0 && (
        <EmptyContainer
          icon={<Building2 className="size-10" />}
          title="No venue found"
          description="There is no venue available at the moment"
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

export default memo(VenueContent);
