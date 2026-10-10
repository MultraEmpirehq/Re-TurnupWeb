import { getData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import EmptyContainer from "@/components/ui/empty-container";
import ErrorContainer from "@/components/ui/error-container";
import VenueCard, { VenueCardSkeleton } from "@/components/ui/venue-card";
import { IVenueDetailsType } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import React, { memo, useMemo } from "react";
import useExploreFilters from "./use-explore-filters";

const getVenues = async (page = 1, q = "") => {
  const urlSearchParams = new URLSearchParams();
  urlSearchParams.set("page", page?.toString());
  if (q) urlSearchParams.set("q", q);
  const url = `/venues?${urlSearchParams.toString()}`;
  const { data } = await getData<IVenueDetailsType[]>(url);
  return data;
};

/** The Venues tab: every venue, searched by the box above (as in the app, everywhere). */
const VenueContent = () => {
  const { q } = useExploreFilters();
  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useInfiniteQuery({
    queryFn: ({ pageParam }) => getVenues(pageParam, q),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage?.pagination?.nextPage,
    queryKey: ["explore-venues", q],
  });
  const isLoading = useMemo(() => !data, [data]);
  const venues = useMemo(() => {
    return data?.pages?.flatMap((page) => page?.data || []) || [];
  }, [data]);
  return (
    <div>
      {(isLoading || (!isLoading && venues && venues.length > 0)) && !error && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
        <div className="mt-8 flex justify-center">
          <Button
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage?.()}
            className="h-11 rounded-full bg-secondary-950 px-7 text-white hover:bg-secondary-900"
          >
            {isFetchingNextPage ? "Loading..." : "Show more venues"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default memo(VenueContent);
