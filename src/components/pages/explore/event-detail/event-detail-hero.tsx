"use client";

import React, { memo } from "react";
import { format } from "date-fns";
import CustomImageComponent from "@/components/ui/custom-image.component";

interface EventDetailHeroProps {
  image?: string;
  name?: string;
  venueName?: string;
  date?: Date | null;
}

const EventDetailHero = ({
  image,
  name,
  venueName,
  date,
}: EventDetailHeroProps) => (
  <div className="w-full aspect-video max-h-[500px] relative bg-black/10 rounded-lg overflow-hidden">
    {image ? (
      <>
        <CustomImageComponent
          src={image}
          alt={name || "Event"}
          fill
          className="size-full"
          imageClassName="object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white bg-linear-to-t from-black/70 to-transparent flex flex-col gap-2">
          <p className="text-xs md:text-sm font-medium opacity-90 uppercase tracking-wider">
            {venueName || "Event"} present
          </p>
          <h1 className="text-2xl md:text-4xl font-bold">
            {name || "Event Name"}
          </h1>
          {date && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">{format(date, "dd MMM")}</span>
              <span>{format(date, "h a")}</span>
            </div>
          )}
        </div>
      </>
    ) : (
      <div className="size-full flex items-center justify-center text-muted-foreground">
        No image
      </div>
    )}
  </div>
);

export default memo(EventDetailHero);
