"use client";
import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import EmptyContainer from "@/components/ui/empty-container";
import ErrorContainer from "@/components/ui/error-container";
import VenueCard, { VenueCardSkeleton } from "@/components/ui/venue-card";
import { useVenues } from "@/hooks/use-venue";
import { ROUTES } from "@/lib/variables";
import { Building2, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { memo, useMemo } from "react";

const VenuesList = () => {
  const router = useRouter();
  const {
    data,
    error,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useVenues();

  const venues = useMemo(
    () => data?.pages?.flatMap((page) => page?.data || []) || [],
    [data],
  );

  const showSkeleton = !data && !error;
  const hasVenues = !!data && venues.length > 0;
  const isEmpty = !!data && venues.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-between gap-3">
        <h1 className="font-bold text-secondary-800">Venues</h1>
        <Button asChild size="sm">
          <Link href={ROUTES.CREATE_VENUE.href}>
            <Plus className="size-4" />
            Create Venue
          </Link>
        </Button>
      </div>

      {(showSkeleton || hasVenues) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {showSkeleton &&
            Array.from({ length: 6 }).map((_, index) => (
              <VenueCardSkeleton key={index} />
            ))}
          {hasVenues &&
            venues.map((venue) => <VenueCard key={venue.id} {...venue} />)}
        </div>
      )}

      {error && !data && (
        <ErrorContainer
          error={constructErrorMessage(
            error as TApiErrorResponseType,
            "Unknown error occurred whilst getting venues list",
          )}
          retryFunction={refetch}
        />
      )}

      {isEmpty && (
        <EmptyContainer
          icon={<Building2 className="size-10" />}
          title="No venues yet"
          description="Create your first venue to start hosting events"
          action={() => router.push(ROUTES.CREATE_VENUE.href)}
          actionText="Create Venue"
        />
      )}

      {hasNextPage && (
        <div className="flex flex-row items-center gap-2 justify-between">
          <Button
            disabled={isFetchingNextPage}
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
          >
            {isFetchingNextPage ? "Loading..." : "See more"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default memo(VenuesList);
