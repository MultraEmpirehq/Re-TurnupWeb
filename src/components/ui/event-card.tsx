import React, { memo, useMemo } from "react";
import CustomImageComponent from "./custom-image.component";
import { formatDate } from "date-fns";
import { Skeleton } from "./skeleton";
import { IEventDetailsType } from "@/lib/types";
import Link from "next/link";
import { ROUTES } from "@/lib/variables";

const EventCardComponent: React.FC<
  IEventDetailsType & { isDashboard?: boolean }
> = ({ name, image, description, date, id, isDashboard = false }) => {
  const eventDetailsURL = useMemo(() => {
    return isDashboard
      ? `${ROUTES.EVENTS.href}/${id}`
      : `${ROUTES.EXPLORE.href}/event/${id}`;
  }, [id, isDashboard]);
  return (
    <div className="flex-col flex items-start bg-white gap-4">
      <Link
        href={eventDetailsURL}
        className="w-full aspect-video bg-cover relative rounded-lg overflow-hidden border border-black/5"
      >
        <CustomImageComponent
          fill
          src={image}
          alt={name}
          className="size-full"
        />
      </Link>
      <div className="w-full flex flex-row items-center gap-4">
        <div className="flex flex-col text-xl md:text-2xl">
          <span className="font-bold text-secondary">
            {formatDate(new Date(date || ""), "dd")}
          </span>
          <span>{formatDate(new Date(), "MMM")}</span>
        </div>
        <div className="flex-col gap-1 flex items-start flex-1">
          <Link href={eventDetailsURL}>
            <h3>{name || "Event Name"}</h3>
          </Link>
          <p className="text-sm opacity-60">
            {description || "Event Description"}
          </p>
          <p className="text-xs opacity-60">
            {formatDate(new Date(date || ""), "hh:mm a")}
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
