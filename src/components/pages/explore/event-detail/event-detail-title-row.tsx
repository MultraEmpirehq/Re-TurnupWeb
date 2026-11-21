"use client";

import React, { memo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Share2, ExternalLink, Check } from "lucide-react";
import { ROUTES } from "@/lib/variables";
import Notice from "@/components/ui/notice";
import useUserStore from "@/stores/user-store";

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
  /** In place of booking, e.g. "Manage in admin" for the Turnupz team. */
  cta?: { label: string; href: string };
  /** New sales paused while the team checks reports. */
  salesPaused?: boolean;
  /** The event is over: nothing left to book. */
  ended?: boolean;
  /** In place of booking once it's over, e.g. "Follow for the next one". */
  endedAction?: React.ReactNode;
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
  cta,
  salesPaused,
  ended,
  endedAction,
}: EventDetailTitleRowProps) => {
  const isExternal = saleMethod === "external_link" || !!ticketUrl;
  const href =
    isExternal && ticketUrl
      ? ticketUrl
      : `${ROUTES.EXPLORE.href}/event/${eventId}/ticket`;
  const label = saleMethod === "register" ? "Register free" : "Book Now";
  // A business organiser account doesn't book: its people use personal accounts.
  const isBusiness = !!useUserStore((state) => state.userDetails?.isBusiness);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-start md:justify-between">
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
              <Check className="size-4 text-success" />
            ) : (
              <Share2 className="size-4" />
            )}
          </Button>
        </div>
        {byline}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {actions}
        {ended && !cta ? (
          endedAction ?? (
            <Button disabled variant="outline" className="shrink-0">
              Event ended
            </Button>
          )
        ) : salesPaused && !cta ? (
          <Button disabled className="shrink-0" title="Sales are paused while our team checks this event">
            Sales paused
          </Button>
        ) : isBusiness && !cta && !(isExternal && ticketUrl) ? (
          <Button disabled className="shrink-0" title="Use your personal Turnupz account to get tickets">
            Business accounts can&apos;t book
          </Button>
        ) : (
        <Button
          asChild
          className="shrink-0 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {cta ? (
            <Link href={cta.href}>{cta.label}</Link>
          ) : isExternal && ticketUrl ? (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {label}
              <ExternalLink className="size-4" aria-hidden />
            </a>
          ) : (
            <Link href={href}>{label}</Link>
          )}
        </Button>
        )}
      </div>
      {ended && !cta && (
        <Notice
          tone="neutral"
          title="This event has ended"
          className="md:w-full md:basis-full"
          action={
            <Button asChild variant="outline" className="rounded-xl">
              <Link href={ROUTES.EXPLORE.href}>Find what&apos;s on</Link>
            </Button>
          }
        >
          <p>Tickets are no longer on sale. If you went, we hope it was a good one.</p>
        </Notice>
      )}
      {salesPaused && !ended && !cta && (
        <Notice tone="warning" title="Ticket sales are paused" className="md:w-full md:basis-full">
          <p>Our team is checking this event. If you already have a ticket, it&apos;s still valid.</p>
        </Notice>
      )}
    </div>
  );
};

export default memo(EventDetailTitleRow);
