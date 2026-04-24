"use client";

import React, { memo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Share2, ExternalLink, Check } from "lucide-react";
import { ROUTES } from "@/lib/variables";

interface EventDetailTitleRowProps {
  eventId: string;
  name?: string;
  onShare: () => void;
  copied: boolean;
}

const EventDetailTitleRow = ({
  eventId,
  name,
  onShare,
  copied,
}: EventDetailTitleRowProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div className="flex items-center gap-2">
      <h2 className="text-2xl font-bold">{name || "Event Name"}</h2>
      <Button
        variant="outline"
        size="icon"
        className="shrink-0"
        onClick={onShare}
        aria-label={copied ? "Copied" : "Copy link"}
      >
        {copied ? (
          <Check className="size-4 text-green-600" />
        ) : (
          <Share2 className="size-4" />
        )}
      </Button>
    </div>
    <Button asChild variant="destructive" className="shrink-0 gap-2">
      <Link href={`${ROUTES.EXPLORE.href}/event/${eventId}/ticket`}>
        Book Now
        <ExternalLink className="size-4" />
      </Link>
    </Button>
  </div>
);

export default memo(EventDetailTitleRow);
