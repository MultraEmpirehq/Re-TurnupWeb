import React, { memo } from "react";
import CustomImageComponent from "./custom-image.component";
import { formatDate } from "date-fns";
import { Skeleton } from "./skeleton";
import { EventDetailsType } from "@/lib/types";

const EventCardComponent: React.FC<EventDetailsType> = ({
  name,
  image,
  description,
}) => {
  return (
    <div className="flex-col flex items-start bg-white gap-4">
      <div className="w-full aspect-video bg-cover relative rounded-lg overflow-hidden">
        <CustomImageComponent src={image} alt={name} className="size-full" />
      </div>
      <div className="w-full flex flex-row items-center gap-4">
        <div className="flex flex-col text-xl md:text-2xl">
          <span className="font-bold text-secondary">
            {formatDate(new Date(), "dd")}
          </span>
          <span>{formatDate(new Date(), "MMM")}</span>
        </div>
        <div className="flex-col gap-1 flex items-start flex-1">
          <h3>{name || "Event Name"}</h3>
          <p className="text-sm opacity-60">
            {description || "Event Description"}
          </p>
          <p className="text-xs opacity-60">
            {formatDate(new Date(), "hh:mm a")}
          </p>
        </div>
      </div>
    </div>
  );
};

export const EventCardSkeleton = memo(() => {
  return (
    <div className="flex flex-col items-start gap-4">
      <Skeleton className="w-full aspect-video rounded-lg" />
      <Skeleton className="w-full h-5 rounded-lg" />
      <Skeleton className="w-full h-5 rounded-lg" />
      <Skeleton className="w-1/2 h-10 rounded-lg" />
    </div>
  );
});

EventCardSkeleton.displayName = "EventCardSkeleton";

export default memo(EventCardComponent);
