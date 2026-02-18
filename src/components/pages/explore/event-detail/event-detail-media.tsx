"use client";

import React, { memo } from "react";
import CustomImageComponent from "@/components/ui/custom-image.component";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface EventDetailMediaProps {
  mediaList: string[];
  eventName?: string;
}

const EventDetailMedia = ({ mediaList, eventName }: EventDetailMediaProps) => (
  <section className="space-y-4">
    <h3 className="text-lg font-semibold">Event Media</h3>
    {mediaList.length > 1 ? (
      <Carousel className="w-full">
        <CarouselContent className="-ml-2 md:-ml-4">
          {mediaList.map((src) => (
            <CarouselItem
              key={src}
              className="pl-2 md:pl-4 basis-full md:basis-1/2"
            >
              <div className="aspect-video relative rounded-lg overflow-hidden bg-muted">
                <CustomImageComponent
                  src={src}
                  alt={eventName || "Event media"}
                  fill
                  className="size-full"
                  imageClassName="object-cover"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    ) : (
      <div className="aspect-video max-h-[400px] relative rounded-lg overflow-hidden bg-muted">
        <CustomImageComponent
          src={mediaList[0]}
          alt={eventName || "Event media"}
          fill
          className="size-full"
          imageClassName="object-cover"
        />
      </div>
    )}
  </section>
);

export default memo(EventDetailMedia);
