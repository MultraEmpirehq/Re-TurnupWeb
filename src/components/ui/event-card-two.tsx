import { EventDetailsType } from "@/lib/types";
import React, { memo } from "react";
import CustomImageComponent from "./custom-image.component";
import { format } from "date-fns";
import { StarIcon } from "lucide-react";
import { Skeleton } from "./skeleton";

const EventCardTwo: React.FC<EventDetailsType> = ({
  name,
  date = new Date(),
  venue,
  image,
}) => {
  return (
    <div className="bg-white p-1 rounded-md shadow-sm flex flex-row items-start gap-2">
      <div className="w-1/2 max-w-[200px] aspect-video relative">
        <CustomImageComponent className="size-full" src={image} alt={name} />
        <button className="size-3 rounded-full bg-white items-center justify-center inline-flex absolute top-4 right-4">
          <span>
            <StarIcon size={14} />
          </span>
          <span className="sr-only">Add to favorite</span>
        </button>
      </div>
      <div className="space-y-2">
        <h2 className="font-bold">{name || "Event name"}</h2>
        <p className="font-medium text-sm">
          {format(new Date(date || ""), "do MMM yy")} |{" "}
          {venue?.address || "Event location"}
        </p>
        <p className="opacity-60 text-sm">
          {format(new Date(date || ""), "HH:mm a")}
        </p>
      </div>
    </div>
  );
};

export const EventCardTwoCardLoader = memo(() => {
  return (
    <div className="flex flex-row items-center gap-4">
      <div className="w-[50%] max-w-[200px] aspect-video">
        <Skeleton className="size-full" />
      </div>
      <div className="space-y-2 flex-1">
        <Skeleton className="w-full h-2" />
        <Skeleton className="w-full h-2" />
        <Skeleton className="w-[60%] h-2" />
        <Skeleton className="w-full h-2" />
        <Skeleton className="w-full h-2" />
      </div>
    </div>
  );
});

EventCardTwoCardLoader.displayName = "Event Card Two loader";

export default memo(EventCardTwo);
