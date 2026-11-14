"use client";

import { Button } from "@/components/ui/button";
import { useEvents } from "@/hooks/use-event";
import { ROUTES } from "@/lib/variables";
import { CalendarSearch, Globe2, MapPin } from "lucide-react";
import Link from "next/link";
import React, { memo, useMemo } from "react";
import TicketCard, { TicketCardSkeleton } from "../home/landing/ticket-card";

/** "GB" → "United Kingdom", in the visitor's language. */
export const countryName = (code?: string) => {
  if (!code) return undefined;
  try {
    return new Intl.DisplayNames([navigator.language || "en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
};

/** The visitor's country from their browser's language ("GB" from "en-GB"). */
export const visitorRegion = () => {
  try {
    return new Intl.Locale(navigator.language).maximize().region?.toUpperCase();
  } catch {
    return undefined;
  }
};

/** Organisers in a place with nothing on yet: be the first. */
const HostHere = memo(({ place }: { place: string }) => (
  <section className="flex flex-col gap-4 rounded-3xl bg-secondary-950 px-6 py-7 text-white sm:flex-row sm:items-center sm:justify-between sm:px-8">
    <div className="space-y-1">
      <h3 className="text-lg font-bold">Running events in {place}?</h3>
      <p className="text-sm text-white/70">
        Be the first organiser here. Sell tickets, scan at the door and get paid, all in one place.
      </p>
    </div>
    <Button asChild className="h-11 shrink-0 rounded-full bg-card px-6 text-secondary-950 hover:bg-white/90">
      <Link href={ROUTES.VENDOR_LOGIN.href}>Host an event</Link>
    </Button>
  </section>
));
HostHere.displayName = "HostHere";

/**
 * Browsing a place with nothing coming up: say so plainly, offer everywhere
 * instead, and show what's popular elsewhere so the page is never a dead end.
 */
const NoEventsHere: React.FC<{
  place: string;
  onShowEverywhere: () => void;
}> = ({ place, onShowEverywhere }) => {
  const { data, isLoading } = useEvents({ limit: 6 });
  const elsewhere = useMemo(
    () => (data?.pages?.flatMap((page) => page?.data || []) || []).filter(Boolean),
    [data],
  );

  return (
    <div className="space-y-10">
      <section
        aria-labelledby="no-events-title"
        className="flex flex-col gap-6 rounded-3xl border border-secondary-100 bg-card p-6 sm:flex-row sm:items-center sm:p-8"
      >
        <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary">
          <CalendarSearch className="size-7" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <h3 id="no-events-title" className="text-xl font-bold text-secondary-950">
            No events in {place} yet
          </h3>
          <p className="text-secondary-950/60">
            Nothing is coming up here right now. See what&apos;s on everywhere, or pick another place.
          </p>
        </div>
        <Button
          type="button"
          onClick={onShowEverywhere}
          className="h-11 shrink-0 rounded-full px-6"
        >
          <Globe2 className="size-4" aria-hidden />
          See events everywhere
        </Button>
      </section>

      {(isLoading || elsewhere.length > 0) && (
        <section aria-labelledby="elsewhere-title" className="space-y-5">
          <div className="space-y-1">
            <h3 id="elsewhere-title" className="text-xl font-bold text-secondary-950">
              Popular elsewhere
            </h3>
            <p className="text-sm text-secondary-950/60">What people are booking right now</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => <TicketCardSkeleton key={index} />)
              : elsewhere.map((event) => <TicketCard key={event.id} event={event} />)}
          </div>
        </section>
      )}

      <HostHere place={place} />
    </div>
  );
};

/** Shown above everything when the visitor's own country has nothing on yet. */
export const NothingInYourCountry = memo(({ country }: { country: string }) => (
  <p className="flex items-start gap-2 rounded-2xl bg-primary-50 px-4 py-3 text-sm text-secondary-950">
    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
    <span>
      <span className="font-semibold">No events in {country} yet</span>, so here&apos;s what&apos;s on everywhere.
      We&apos;re live in more places soon.
    </span>
  </p>
));
NothingInYourCountry.displayName = "NothingInYourCountry";

export default memo(NoEventsHere);
