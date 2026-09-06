"use client";

import { Button } from "@/components/ui/button";
import { useEvents } from "@/hooks/use-event";
import { IEventDetailsType } from "@/lib/types";
import useUserStore from "@/stores/user-store";
import Link from "next/link";
import React, { memo, useMemo } from "react";

const formatEventDate = (date: Date | string) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
};

const isLiveOrUpcomingEvent = (event: IEventDetailsType) => {
  return new Date(event.date).getTime() >= Date.now();
};

const getEngagementScore = (event: IEventDetailsType) => {
  const ticketWeight = (event.totalTickets ?? 0) * 10;
  const guestWeight = (event.eventGuestsOfHonour?.length ?? 0) * 5;
  const activityWeight = (event.activities?.length ?? 0) * 4;
  const mediaWeight = (event.medias?.length ?? 0) * 2;
  const infoWeight = (event.additionalInformation?.length ?? 0) * 1;

  return (
    ticketWeight + guestWeight + activityWeight + mediaWeight + infoWeight
  );
};

const compactDescription = (description?: string) => {
  if (!description) {
    return "Create and polish a headline event so your featured listing is ready for attendees.";
  }

  const words = description.trim().split(/\s+/);
  return words.length > 34
    ? `${words.slice(0, 34).join(" ")}...`
    : description;
};

const DashboardTicketSales = () => {
  const userId = useUserStore((state) => state?.userDetails?.id);
  const { data } = useEvents(
    { limit: 20 },
  );
  const { data: userEventsData } = useEvents(
    { limit: 20, userId: userId ?? undefined },
    { enabled: !!userId },
  );

  const events = useMemo(() => {
    const merged = [
      ...(data?.pages?.flatMap((page) => page?.data ?? []) ?? []),
      ...(userEventsData?.pages?.flatMap((page) => page?.data ?? []) ?? []),
    ];
    return Array.from(new Map(merged.map((event) => [event.id, event])).values());
  }, [data, userEventsData]);

  const spotlightEvent = useMemo<IEventDetailsType | null>(() => {
    if (events.length === 0) {
      return null;
    }

    const liveEvents = events.filter(isLiveOrUpcomingEvent);
    const source = liveEvents.length > 0 ? liveEvents : events;

    return [...source].sort((left, right) => {
      const engagementDelta = getEngagementScore(right) - getEngagementScore(left);

      if (engagementDelta !== 0) {
        return engagementDelta;
      }

      return new Date(left.date).getTime() - new Date(right.date).getTime();
    })[0];
  }, [events]);

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <article className="rounded-[1.6rem] border border-secondary-100 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:rounded-[2.2rem] sm:p-8">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-secondary-400">
            Event Spotlight
          </p>
          <h2 className="text-[clamp(1.7rem,3vw,2.35rem)] font-bold tracking-tight text-secondary-950">
            {spotlightEvent?.name || "Your next headline event starts here"}
          </h2>
          <p className="line-clamp-3 max-w-2xl text-sm leading-6 text-secondary-500">
            {compactDescription(spotlightEvent?.description)}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 text-sm text-secondary-500 sm:grid-cols-2 sm:gap-6">
          <div className="space-y-1">
            <p className="font-semibold text-secondary-950">Event Date</p>
            <p>
              {spotlightEvent
                ? formatEventDate(spotlightEvent.date)
                : "Choose a launch date"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-secondary-950">Venue</p>
            <p>{spotlightEvent?.venue?.name || "Assign a venue"}</p>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-secondary-950">Tickets</p>
            <p>
              {spotlightEvent
                ? `${(spotlightEvent.totalTickets ?? 0).toLocaleString()} published`
                : "Add ticket types"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-secondary-950">Status</p>
            <p>
              {spotlightEvent
                ? isLiveOrUpcomingEvent(spotlightEvent)
                  ? "Most active live event"
                  : "Top archived event"
                : "Draft your next event"}
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            asChild
            className="h-12 rounded-2xl bg-secondary-400 text-base font-semibold text-white hover:bg-secondary-500"
          >
            <Link href={spotlightEvent ? `/app/events/${spotlightEvent.id}/edit` : "/app/create"}>
              {spotlightEvent ? "Edit Event" : "Create Event"}
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-12 rounded-2xl border-secondary-200 bg-secondary-50 text-base font-semibold text-secondary-950 hover:bg-secondary-100"
          >
            <Link href={spotlightEvent ? `/app/events/${spotlightEvent.id}` : "/app/events"}>
              View
            </Link>
          </Button>
        </div>
      </article>

      <article className="rounded-[1.6rem] bg-[#11172d] px-5 py-7 text-white shadow-[0_20px_50px_rgba(17,23,45,0.24)] sm:rounded-[2.2rem] sm:px-8 sm:py-9">
        <div className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/40">
            Event Momentum
          </p>
          <h2 className="text-[clamp(1.8rem,3vw,2.55rem)] font-bold leading-tight tracking-tight">
            Keep this listing polished and ready for the next turnout push.
          </h2>
          <p className="max-w-xl text-sm leading-7 text-white/72 sm:text-base sm:leading-8">
            Use the edit screen to update the event story, tighten the venue
            details, and keep attendees looking at the strongest version of
            your listing.
          </p>
          <Button
            asChild
            className="mt-4 h-12 rounded-2xl bg-secondary-400 px-7 text-base font-semibold text-white hover:bg-secondary-500"
          >
            <Link href={spotlightEvent ? `/app/events/${spotlightEvent.id}/edit` : "/app/create"}>
              Refine Event
            </Link>
          </Button>
        </div>
      </article>
    </section>
  );
};

export default memo(DashboardTicketSales);
