"use client";

import React, { memo } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { IVenueDetailsType } from "@/lib/types";

interface EventDetailLocationProps {
  venue: IVenueDetailsType;
}

const EventDetailLocation = ({ venue }: EventDetailLocationProps) => (
  <section className="space-y-3">
    <h3 className="text-lg font-semibold">Location</h3>
    <div className="flex items-start gap-2 min-w-0">
      <MapPin className="size-4 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <Link
          href={`/explore/venue/${venue.id}`}
          className="font-medium text-primary hover:underline"
        >
          {venue.name}
        </Link>
        {venue.address && (
          <p className="text-muted-foreground text-sm mt-0.5">
            {venue.address}
          </p>
        )}
      </div>
    </div>
  </section>
);

export default memo(EventDetailLocation);
