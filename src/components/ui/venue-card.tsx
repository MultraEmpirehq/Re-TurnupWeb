import { VenueDetailsType } from "@/lib/types";
import React, { memo } from "react";
import CustomImageComponent from "./custom-image.component";
import { Skeleton } from "./skeleton";

const VenueCard: React.FC<VenueDetailsType> = ({
  images,
  name,
  address,
  totalAvailableSeat,
}) => {
  return (
    <div className="space-y-3">
      <div className="aspect-video w-full max-h-[300px]">
        <CustomImageComponent
          className="size-full"
          src={images?.[0] || ""}
          alt={name}
        />
      </div>
      <div className="space-y-2">
        <h1 className="font-medium uppercase">
          {name || "Venue Name"} | {address || "Venue Address"}
        </h1>
        <p className="opacity-60 text-sm">Up to {totalAvailableSeat || 0}</p>
      </div>
    </div>
  );
};

export const VenueCardSkeleton = memo(() => {
  return (
    <div className="flex flex-col items-start gap-4">
      <Skeleton className="w-full aspect-video rounded-lg" />
      <Skeleton className="w-full h-5 rounded-lg" />
      <Skeleton className="w-full h-5 rounded-lg" />
      <Skeleton className="w-1/2 h-10 rounded-lg" />
    </div>
  );
});

VenueCardSkeleton.displayName = "Venue Card Skeleton";

export default memo(VenueCard);
