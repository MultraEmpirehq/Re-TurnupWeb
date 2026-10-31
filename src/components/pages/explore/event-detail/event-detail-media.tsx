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

/**
 * The gallery as a strip of same-size photos, so one picture or twenty take
 * the same height. The arrows sit inside it, and only when there's more to see.
 */
const EventDetailMedia = ({ mediaList, eventName }: EventDetailMediaProps) => (
  <section className="space-y-4">
    <h3 className="text-lg font-semibold">Event Media</h3>
    <Carousel className="w-full" opts={{ align: "start" }}>
      <CarouselContent className="-ml-3">
        {mediaList.map((src, index) => (
          <CarouselItem
            key={`${src}-${index}`}
            className="basis-4/5 pl-3 sm:basis-1/2 lg:basis-1/3"
          >
            <div className="relative h-48 overflow-hidden rounded-xl bg-muted sm:h-56">
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
      {mediaList.length > 1 && (
        <>
          <CarouselPrevious className="left-2 bg-white/90 shadow-sm disabled:hidden" />
          <CarouselNext className="right-2 bg-white/90 shadow-sm disabled:hidden" />
        </>
      )}
    </Carousel>
  </section>
);

export default memo(EventDetailMedia);
