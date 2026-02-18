"use client";
import { useParams } from "next/navigation";
import React, { memo } from "react";
import { useVenue } from "@/hooks/use-venue";
import SectionContainer from "@/components/layouts/section-container/section-container";
import { Skeleton } from "@/components/ui/skeleton";
import { EventCardSkeleton } from "@/components/ui/event-card";
import ErrorContainer from "@/components/ui/error-container";
import { constructErrorMessage } from "@/api/functions";
import CustomImageComponent from "@/components/ui/custom-image.component";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import StarList from "@/components/ui/star-list";
import { MapPinIcon } from "lucide-react";
import EventsWithVenueIdList from "@/components/pages/explore/events-with-venue-id-list";

const EventDetails = () => {
  const params = useParams();
  const { id } = params;
  const { data, error, refetch } = useVenue(id?.toString() || "");

  if (!data && !error)
    return (
      <SectionContainer className="space-y-14 py-14">
        <div className="space-y-4 w-full">
          <Skeleton className="w-full aspect-video max-h-[500px] rounded-lg" />
          <div className="flex flex-col gap-4">
            <Skeleton className="w-1/2 h-3 rounded-lg" />
            <Skeleton className="w-1/3 h-3 rounded-lg" />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Skeleton className="w-1/4 h-4 rounded-lg" />
          <Skeleton className="w-full h-3 rounded-lg" />
          <Skeleton className="w-full h-3 rounded-lg" />
          <Skeleton className="w-full h-3 rounded-lg" />
          <Skeleton className="w-full h-3 rounded-lg" />
        </div>
        <div className="space-y-4">
          <Skeleton className="w-1/4 h-4 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {Array.from({ length: 6 }).map((_, index) => (
              <EventCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </SectionContainer>
    );

  if (error)
    return (
      <SectionContainer className="space-y-14 py-14 min-h-[500px] h-screen flex items-center justify-center">
        <ErrorContainer
          error={constructErrorMessage(
            error as TApiErrorResponseType,
            "Unknown error occurred whilst getting venue details",
          )}
          retryFunction={refetch}
        />
      </SectionContainer>
    );

  return (
    <SectionContainer className="space-y-14 py-20">
      <div className="w-full aspect-video relative bg-black/5 rounded-lg overflow-hidden">
        {data?.images && data?.images?.length > 1 && (
          <Carousel className="aspect-video w-full">
            <CarouselContent className="aspect-video w-full">
              {(data?.images || [])?.map((image) => (
                <CarouselItem key={image} className="aspect-video w-full">
                  <CustomImageComponent
                    src={image || ""}
                    alt={data?.name || ""}
                    fill
                    className="size-full"
                    imageClassName="object-cover"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        )}
        {data?.images && data?.images?.length < 2 && (
          <CustomImageComponent
            src={data?.images?.[0] || ""}
            alt={data?.name || ""}
            fill
            className="size-full"
            imageClassName="object-cover"
          />
        )}
      </div>
      <div className="space-y-2 pt-2">
        <h1 className="text-2xl font-bold">{data?.name || "Venue Name"}</h1>
        <StarList rating={data?.rating || 0} totalStars={5} />
        <p className="opacity-60 text-sm">
          Up to {data?.totalAvailableSeat || 0} seats
        </p>
        <div className="flex flex-row items-center gap-2">
          <span>
            <MapPinIcon size={16} />
          </span>
          <p className="opacity-60 text-sm">
            {data?.address || "Venue Address"}
          </p>
        </div>
      </div>
      <div className="space-y-2 mt-10">
        <h2 className="text-lg font-bold">Description</h2>
        <p className="opacity-60 text-sm">
          {data?.description || "Venue Description"}
        </p>
      </div>

      <div className="space-y-4 mt-16">
        <h2 className="text-lg font-bold">Upcoming Events in this venue</h2>
        <EventsWithVenueIdList venueId={id?.toString() || ""} />
      </div>
    </SectionContainer>
  );
};

export default memo(EventDetails);
