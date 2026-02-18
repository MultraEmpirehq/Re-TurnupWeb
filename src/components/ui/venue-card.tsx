import { IVenueDetailsType } from "@/lib/types";
import React, { memo } from "react";
import CustomImageComponent from "./custom-image.component";
import { Skeleton } from "./skeleton";
import { ROUTES } from "@/lib/variables";
import Link from "next/link";

const VenueCard: React.FC<IVenueDetailsType> = ({
  images,
  name,
  address,
  totalAvailableSeat,
  id,
}) => {
  return (
    <div className="space-y-3">
      <Link
        href={`${ROUTES.EXPLORE.href}/venue/${id}`}
        className="aspect-video inline-flex w-full max-h-[300px] relative"
      >
        <CustomImageComponent
          className="size-full"
          src={images?.[0] || ""}
          alt={name}
          fill
        />
      </Link>
      <div className="space-y-2">
        <Link href={`${ROUTES.EXPLORE.href}/venue/${id}`}>
          <h1 className="font-medium uppercase">
            {name || "Venue Name"} | {address || "Venue Address"}
          </h1>
        </Link>
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
