"use client";

import CustomImageComponent from "@/components/ui/custom-image.component";
import {
  TBoostPlacement,
  TSponsoredEvent,
  recordClick,
  recordImpressions,
  useSponsored,
} from "@/hooks/use-boosts";
import { formatEventDateRange, formatEventTime } from "@/lib/event-time";
import { ROUTES } from "@/lib/variables";
import { cn } from "@/lib/utils";
import { ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import useExplorePlace from "./use-explore-place";

const whenOf = (event: TSponsoredEvent) =>
  (event.days?.length ?? 0) > 1 && event.endDate
    ? formatEventDateRange(event.date, event.endDate, event.timezone)
    : formatEventTime(event.date, event.timezone, { withYear: false });

const placeOf = (event: TSponsoredEvent) =>
  [event.venue?.name ?? event.venueName, event.eventCity]
    .filter(Boolean)
    .join(", ");

/** The event's page, tagged so a sale that follows counts for the boost. */
const hrefOf = (event: TSponsoredEvent) =>
  `${ROUTES.EXPLORE.href}/event/${event.id}?src=boost`;

/**
 * Boosts for the area in view: a location filter wins, otherwise the place
 * Explore is looking at, so nobody browsing the UK is shown a Lagos boost.
 */
const useSponsoredHere = (
  placement: TBoostPlacement,
  area: { countryCode?: string; city?: string; q?: string },
) => {
  const { place, isReady } = useExplorePlace();
  const filtered = !!area.countryCode;
  return useSponsored({
    placement,
    countryCode: filtered ? area.countryCode : place?.countryCode,
    city: filtered ? area.city : place?.city,
    q: area.q,
    enabled: isReady,
  });
};

/** Counts the set once when it's on screen. */
const useSeen = (events: TSponsoredEvent[]) => {
  const ref = useRef<HTMLDivElement>(null);
  const key = events.map((event) => event.boostId).join(",");
  useEffect(() => {
    const node = ref.current;
    if (!node || !key) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          recordImpressions(key.split(","));
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [key]);
  return ref;
};

const SponsoredTag: React.FC<{ className?: string }> = ({ className }) => (
  <span
    className={cn(
      "rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur",
      className,
    )}
  >
    Sponsored
  </span>
);

/**
 * Boosted events at the top of Explore (or of search results): up to three,
 * always marked Sponsored, in a different order each visit.
 */
export const SponsoredRow: React.FC<{
  placement: Extract<TBoostPlacement, "EXPLORE" | "SEARCH">;
  countryCode?: string;
  city?: string;
  q?: string;
}> = memo(({ placement, countryCode, city, q }) => {
  const { data: events = [] } = useSponsoredHere(placement, {
    countryCode,
    city,
    q,
  });
  const ref = useSeen(events);
  if (!events.length) return null;
  return (
    <section ref={ref} aria-label="Sponsored events" className="space-y-3">
      <p className="text-xs font-bold tracking-[0.18em] text-secondary-400 uppercase">
        Sponsored
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Link
            key={event.id}
            href={hrefOf(event)}
            onClick={() => recordClick(event.boostId)}
            className="group overflow-hidden rounded-2xl bg-white ring-2 ring-primary/60 transition-shadow hover:shadow-lg"
          >
            <span className="relative block aspect-[16/9] bg-secondary-100">
              <CustomImageComponent
                src={(event.image || event.medias?.[0])!}
                alt={event.name}
                fill
                className="size-full"
                imageClassName="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <SponsoredTag className="absolute top-3 left-3" />
              {event.momentum?.sellingFast && (
                <span className="absolute top-3 right-3 rounded-full bg-orange-500 px-2.5 py-1 text-[11px] font-extrabold text-white">
                  🔥 Selling fast
                </span>
              )}
            </span>
            <span className="block space-y-0.5 p-4">
              <span className="block truncate font-bold text-secondary-950">
                {event.name}
              </span>
              <span className="block truncate text-sm text-secondary-500">
                {whenOf(event)}
              </span>
              {placeOf(event) && (
                <span className="flex items-center gap-1 truncate text-sm text-secondary-500">
                  <MapPin className="size-3.5 shrink-0" aria-hidden />
                  {placeOf(event)}
                </span>
              )}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
});
SponsoredRow.displayName = "SponsoredRow";

/**
 * The big Featured card on the home page: a boosted event, or a few taking
 * turns every few seconds. Hidden when nothing is boosted.
 */
export const FeaturedBoost: React.FC<{ countryCode?: string; city?: string }> =
  memo(({ countryCode, city }) => {
    const { data: events = [] } = useSponsoredHere("HOME", {
      countryCode,
      city,
    });
    const [index, setIndex] = useState(0);
    const ref = useSeen(events);
    useEffect(() => {
      if (events.length < 2) return;
      const timer = setInterval(
        () => setIndex((current) => (current + 1) % events.length),
        6000,
      );
      return () => clearInterval(timer);
    }, [events.length]);
    const event = useMemo(
      () => events[index % Math.max(events.length, 1)],
      [events, index],
    );
    if (!event) return null;
    // The cheapest paid ticket, for "from …".
    const price = event.eventTickets
      ?.map((ticket) => ticket.ticketPrice)
      .filter(
        (price): price is Exclude<typeof price, number> =>
          typeof price === "object" && (price?.amount ?? 0) > 0,
      )
      .sort((a, b) => a.amount - b.amount)[0];

    return (
      <section
        ref={ref}
        aria-label="Featured event"
        className="mx-auto max-w-[1200px] px-horizontal py-10"
      >
        <Link
          href={hrefOf(event)}
          onClick={() => recordClick(event.boostId)}
          className="group relative block h-[340px] overflow-hidden rounded-[28px] bg-secondary-900 sm:h-[400px]"
        >
          <CustomImageComponent
            src={(event.image || event.medias?.[0])!}
            alt={event.name}
            fill
            className="size-full"
            imageClassName="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
          <span className="absolute inset-0 bg-linear-to-r from-[#06142e]/90 via-[#06142e]/45 to-transparent" />
          <SponsoredTag className="absolute top-5 right-5" />
          <span className="absolute bottom-7 left-7 max-w-[min(560px,80%)] space-y-3 text-white">
            {event.momentum?.sellingFast && (
              <span className="inline-block rounded-full bg-orange-500 px-2.5 py-1 text-xs font-extrabold">
                🔥 Selling fast
              </span>
            )}
            <span className="block text-3xl font-extrabold leading-tight sm:text-4xl">
              {event.name}
            </span>
            <span className="block text-sm text-white/85 sm:text-base">
              {whenOf(event)}
              {placeOf(event) ? ` · ${placeOf(event)}` : ""}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-extrabold text-[#06142e]">
              Get tickets
              {price?.formatted?.withCurrency
                ? ` · from ${price.formatted.withCurrency}`
                : ""}
              <ArrowRight className="size-4" aria-hidden />
            </span>
          </span>
          {events.length > 1 && (
            <span
              className="absolute right-6 bottom-6 flex gap-1.5"
              aria-hidden
            >
              {events.map((item, dot) => (
                <span
                  key={item.id}
                  className={cn(
                    "h-1.5 rounded-full bg-white",
                    dot === index % events.length ? "w-6" : "w-1.5 opacity-50",
                  )}
                />
              ))}
            </span>
          )}
        </Link>
      </section>
    );
  });
FeaturedBoost.displayName = "FeaturedBoost";
