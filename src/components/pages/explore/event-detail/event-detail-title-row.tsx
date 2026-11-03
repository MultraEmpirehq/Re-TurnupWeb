"use client";

import React, { memo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Share2, ExternalLink, Check } from "lucide-react";
import { ROUTES } from "@/lib/variables";

interface EventDetailTitleRowProps {
  eventId: string;
  name?: string;
  saleMethod?: string;
  ticketUrl?: string;
  onShare: () => void;
  copied: boolean;
  /** "by <organiser>", under the name. */
  byline?: React.ReactNode;
  /** Message and follow the organiser, beside the booking button. */
  actions?: React.ReactNode;
}

const EventDetailTitleRow = ({
  eventId,
  name,
  saleMethod,
  ticketUrl,
  onShare,
  copied,
  byline,
  actions,
}: EventDetailTitleRowProps) => {
  const isExternal = saleMethod === "external_link" || !!ticketUrl;
  const href =
    isExternal && ticketUrl
      ? ticketUrl
      : `${ROUTES.EXPLORE.href}/event/${eventId}/ticket`;
  const label = saleMethod === "register" ? "Register free" : "Book Now";

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0 space-y-1">
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
        {byline}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {actions}
        <Button
          asChild
          className="shrink-0 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isExternal && ticketUrl ? (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {label}
              <ExternalLink className="size-4" aria-hidden />
            </a>
          ) : (
            <Link href={href}>{label}</Link>
          )}
        </Button>
      </div>
    </div>
  );
};

export default memo(EventDetailTitleRow);
