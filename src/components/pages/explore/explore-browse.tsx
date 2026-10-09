"use client";

import FollowButton from "@/components/discovery/follow-button";
import PerformerAvatar from "@/components/discovery/performer-avatar";
import { performerHref } from "@/components/discovery/performer-card";
import CustomImageComponent from "@/components/ui/custom-image.component";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CHART_REGIONS,
  PERFORMER_TYPE_LABELS,
  usePerformerChartFor,
  usePlanners,
} from "@/hooks/use-discovery";
import { useEvents } from "@/hooks/use-event";
import { useVenues } from "@/hooks/use-venue";
import { formatEventTime } from "@/lib/event-time";
import { IEventDetailsType, IPerformer, IVenueDetailsType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/variables";
import { endOfDay, endOfWeek, startOfDay } from "date-fns";
import { ArrowRight, Flame, MapPin, Mic2, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import React, { memo, useMemo } from "react";
import ExplorePlacePicker from "./explore-place-picker";
import useExploreFilters from "./use-explore-filters";
import useExplorePlace from "./use-explore-place";

/**
 * Explore while nothing is searched or filtered, in the app's order: what's on
 * today, what's trending, the top performers, venues and planners, each headed
 * by the place it looks in ("Trending in Lagos ▾", which changes it). Each is
 * laid out for what it is rather than as another row of cards: a bento for
 * tonight, a numbered chart, a podium, a photo collage.
 */

const eventHref = (event: IEventDetailsType) =>
  `${ROUTES.EXPLORE.href}/event/${event.id}`;

const placeOf = (event: IEventDetailsType) =>
  event.venue?.name ||
  event.venueName ||
  event.eventCity ||
  event.eventState ||
  "Venue to be announced";

const flatEvents = (data?: { pages?: { data?: IEventDetailsType[] }[] }) =>
  (data?.pages?.flatMap((page) => page?.data || []) || []).filter(Boolean);

const SectionHeader: React.FC<{
  icon: React.ElementType;
  eyebrow: string;
  title: string;
  /** Adds "in Lagos ▾" after the title. */
  withPlace?: boolean;
  action?: React.ReactNode;
}> = ({ icon: Icon, eyebrow, title, withPlace = true, action }) => (
  <div className="flex flex-wrap items-end justify-between gap-3">
    <div className="space-y-1">
      <p className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.2em] text-primary uppercase">
        <Icon className="size-3.5" aria-hidden />
        {eyebrow}
      </p>
      <h2 className="text-2xl font-bold tracking-tight text-secondary-950 md:text-3xl">
        {title} {withPlace && <ExplorePlacePicker />}
      </h2>
    </div>
    {action}
  </div>
);

const SeeAll: React.FC<{
  onClick?: () => void;
  href?: string;
  label?: string;
}> = ({ onClick, href, label = "See all" }) => {
  const className =
    "group inline-flex items-center gap-1 text-sm font-semibold text-secondary hover:underline";
  const content = (
    <>
      {label}
      <ArrowRight
        className="size-4 transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </>
  );
  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
};

const EmptyNote: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-dashed border-secondary-200 bg-white/60 px-6 py-8 text-sm text-secondary-500">
    {text} Try somewhere else: <ExplorePlacePicker variant="chip" />
  </div>
);

/* ----------------------------------------------------------- happening now */

/** Today as a bento: the lead event large, the rest beside it. */
const HappeningBento: React.FC<{ events: IEventDetailsType[] }> = ({
  events,
}) => {
  const [lead, ...rest] = events;
  const others = rest.slice(0, 4);
  return (
    <div
      className={cn(
        "grid gap-4",
        others.length ? "md:grid-cols-4 md:grid-rows-2" : "md:grid-cols-2",
      )}
    >
      <Link
        href={eventHref(lead)}
        className={cn(
          "group relative isolate flex min-h-[340px] flex-col justify-end overflow-hidden rounded-[2rem] bg-secondary-900 p-6 text-white md:p-8",
          others.length && "md:col-span-2 md:row-span-2 md:min-h-[460px]",
        )}
      >
        <CustomImageComponent
          fill
          src={lead.image}
          alt={lead.name}
          className="absolute inset-0 -z-10 size-full rounded-none"
          imageClassName="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/85 via-black/30 to-transparent" />
        <span className="mb-auto w-fit rounded-full bg-primary px-3 py-1 text-xs font-bold tracking-wider uppercase">
          {lead.category?.name || "Coming up"}
        </span>
        <h3 className="max-w-lg text-3xl leading-tight font-bold md:text-4xl">
          {lead.name}
        </h3>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80">
          <span>
            {formatEventTime(lead.date, lead.timezone, { withYear: false })}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden />
            {placeOf(lead)}
          </span>
        </p>
        <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-secondary-950 transition-transform group-hover:translate-x-1">
          Get tickets
          <ArrowRight className="size-4" aria-hidden />
        </span>
      </Link>
      {others.map((event) => (
        <Link
          key={event.id}
          href={eventHref(event)}
          className="group relative isolate flex min-h-[200px] flex-col justify-end overflow-hidden rounded-3xl bg-secondary-800 p-4 text-white"
        >
          <CustomImageComponent
            fill
            src={event.image}
            alt={event.name}
            className="absolute inset-0 -z-10 size-full rounded-none"
            imageClassName="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
          />
          <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/80 to-transparent" />
          <p className="line-clamp-2 leading-snug font-bold">{event.name}</p>
          <p className="mt-1 truncate text-xs text-white/75">
            {formatEventTime(event.date, event.timezone, {
              withYear: false,
              withWeekday: false,
            })}{" "}
            · {placeOf(event)}
          </p>
        </Link>
      ))}
    </div>
  );
};

/* --------------------------------------------------------------- trending */

/** Trending as a chart: big outlined positions, like a top ten. */
const TrendingChart: React.FC<{ events: IEventDetailsType[] }> = ({
  events,
}) => (
  <ol className="grid grid-cols-1 gap-x-10 gap-y-2 md:grid-cols-2">
    {events.slice(0, 6).map((event, index) => (
      // min-w-0 lets long names truncate instead of widening the column.
      <li key={event.id} className="min-w-0">
        <Link
          href={eventHref(event)}
          className="group flex items-center gap-3 rounded-3xl p-2 pr-4 transition-colors hover:bg-white sm:gap-4"
        >
          <span
            aria-hidden
            className="w-10 shrink-0 text-center text-5xl leading-none font-black sm:w-14 sm:text-6xl text-transparent tabular-nums [-webkit-text-stroke:2px_var(--color-secondary)] transition-colors group-hover:text-secondary/15"
          >
            {index + 1}
          </span>
          <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-secondary-50 sm:size-20">
            <CustomImageComponent
              fill
              src={event.image}
              alt=""
              className="size-full rounded-none"
              imageClassName="object-cover"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="sr-only">Number {index + 1}: </span>
            <span className="block truncate font-bold text-secondary-950 group-hover:text-secondary">
              {event.name}
            </span>
            <span className="block truncate text-sm text-secondary-500">
              {formatEventTime(event.date, event.timezone, { withYear: false })}
            </span>
            <span className="block truncate text-xs text-secondary-400">
              {placeOf(event)}
            </span>
          </span>
        </Link>
      </li>
    ))}
  </ol>
);

/* ------------------------------------------------------------- performers */

/** Second, first, third: the winner stands in the middle. */
const PODIUM_ORDER = [1, 0, 2];
const PODIUM_HEIGHT = ["h-32", "h-24", "h-20"];

/** The top three on a podium, everyone else after them. */
const PerformerPodium: React.FC<{ performers: IPerformer[] }> = ({
  performers,
}) => {
  const top = performers.slice(0, 3);
  const rest = performers.slice(3, 12);
  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-end">
      <div className="flex items-end justify-center gap-2 sm:gap-5">
        {PODIUM_ORDER.filter((index) => top[index]).map((index) => {
          const performer = top[index];
          return (
            <Link
              key={performer.id}
              href={performerHref(performer.id)}
              className="group flex w-[30%] max-w-36 min-w-0 flex-col items-center text-center sm:w-36"
            >
              <PerformerAvatar
                name={performer.name}
                image={performer.image}
                className={cn(
                  "ring-4 ring-white transition-transform group-hover:-translate-y-1",
                  index === 0
                    ? "size-20 text-xl sm:size-32 sm:text-2xl"
                    : "size-16 text-base sm:size-24 sm:text-lg",
                )}
              />
              <span className="mt-3 line-clamp-1 font-bold text-secondary-950 group-hover:text-secondary">
                {performer.name}
              </span>
              <span className="text-xs text-secondary-500">
                {PERFORMER_TYPE_LABELS[performer.type] ?? "Performer"}
              </span>
              <span
                className={cn(
                  "mt-3 flex w-full items-start justify-center rounded-t-2xl pt-2 text-3xl font-black text-white",
                  PODIUM_HEIGHT[index],
                  index === 0
                    ? "bg-linear-to-b from-primary to-primary-600"
                    : "bg-linear-to-b from-secondary to-secondary-600",
                )}
              >
                {index + 1}
              </span>
            </Link>
          );
        })}
      </div>
      {rest.length > 0 && (
        <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2" start={4}>
          {rest.map((performer, index) => (
            <li key={performer.id} className="min-w-0">
              <Link
                href={performerHref(performer.id)}
                className="group flex items-center gap-3 rounded-2xl bg-white p-2.5 ring-1 ring-black/5 hover:shadow-md"
              >
                <span className="w-6 text-center text-sm font-bold text-secondary-400 tabular-nums">
                  {index + 4}
                </span>
                <PerformerAvatar
                  name={performer.name}
                  image={performer.image}
                  className="size-10 text-xs"
                />
                <span className="min-w-0 truncate text-sm font-semibold text-secondary-950 group-hover:text-secondary">
                  {performer.name}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

/* ----------------------------------------------------------------- venues */

/** Spans that make the venue photos read as a collage, not a grid. */
const COLLAGE = [
  "col-span-2 row-span-2",
  "",
  "md:row-span-2",
  "",
  "md:col-span-2",
  "",
  "",
];

const VenueCollage: React.FC<{ venues: IVenueDetailsType[] }> = ({
  venues,
}) => (
  <div className="grid auto-rows-[150px] grid-cols-2 gap-3 md:grid-cols-4">
    {venues.slice(0, COLLAGE.length).map((venue, index) => (
      <Link
        key={venue.id}
        href={`${ROUTES.EXPLORE.href}/venue/${venue.id}`}
        className={cn(
          "group relative isolate overflow-hidden rounded-3xl bg-secondary-100",
          COLLAGE[index],
        )}
      >
        <CustomImageComponent
          fill
          src={venue.images?.[0]}
          alt={venue.name}
          className="absolute inset-0 -z-10 size-full rounded-none"
          imageClassName="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/75 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <p className="truncate font-bold">{venue.name}</p>
          {!!venue.totalAvailableSeat && (
            <p className="text-xs text-white/75">
              Up to {venue.totalAvailableSeat.toLocaleString()} people
            </p>
          )}
        </div>
      </Link>
    ))}
  </div>
);

/* ---------------------------------------------------------------- loading */

const BentoSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-4 md:grid-rows-2">
    <Skeleton className="h-[340px] rounded-[2rem] md:col-span-2 md:row-span-2 md:h-[460px]" />
    {Array.from({ length: 4 }).map((_, index) => (
      <Skeleton key={index} className="h-[200px] rounded-3xl" />
    ))}
  </div>
);

/* ------------------------------------------------------------------- page */

const ExploreBrowse = () => {
  const { setFilters } = useExploreFilters();
  const { place, inLabel, isReady } = useExplorePlace();
  const ready = { enabled: isReady };
  const inPlace = { countryCode: place?.countryCode, city: place?.city };

  const dayKey = new Date().toDateString();
  const ranges = useMemo(() => {
    const now = new Date();
    return {
      today: {
        startDate: startOfDay(now).toISOString(),
        endDate: endOfDay(now).toISOString(),
      },
      week: {
        startDate: startOfDay(now).toISOString(),
        endDate: endOfWeek(now, { weekStartsOn: 1 }).toISOString(),
      },
    };
    // dayKey re-runs this when the date rolls over.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey]);

  const today = useEvents({ limit: 5, ...ranges.today, ...inPlace }, ready);
  const week = useEvents({ limit: 5, ...ranges.week, ...inPlace }, ready);
  const trending = useEvents({ limit: 6, isTrending: true, ...inPlace }, ready);
  const chart = usePerformerChartFor(place?.countryCode, 12, isReady);
  const venues = useVenues(
    place ? { country: place.country, city: place.city } : undefined,
    isReady,
  );
  // Planners come from everywhere, busiest first, as in the app.
  const { data: planners = [] } = usePlanners("", 6);

  const todayItems = useMemo(() => flatEvents(today.data), [today.data]);
  const weekItems = useMemo(() => flatEvents(week.data), [week.data]);
  const trendingItems = useMemo(
    () => flatEvents(trending.data),
    [trending.data],
  );
  const venueItems = useMemo(
    () =>
      (venues.data?.pages?.flatMap((page) => page?.data || []) || [])
        .filter(Boolean)
        .slice(0, COLLAGE.length) as IVenueDetailsType[],
    [venues.data],
  );
  const performers = chart.data?.performers ?? [];
  const chartRegion = chart.data?.region ?? "global";
  const chartTitle =
    chartRegion === "global"
      ? "Top performers worldwide"
      : `Top performers in ${CHART_REGIONS.find((region) => region.value === chartRegion)?.label}`;

  // Happening today, or this week when nothing is on today.
  const soonItems = todayItems.length ? todayItems : weekItems;
  const soonLoading = !today.data || (!todayItems.length && !week.data);

  return (
    <div className="space-y-16">
      <section className="space-y-6">
        <SectionHeader
          icon={Sparkles}
          eyebrow={todayItems.length ? "Tonight and today" : "This week"}
          title={todayItems.length ? "Happening today" : "Happening this week"}
          action={
            soonItems.length > 0 && (
              <SeeAll
                onClick={() =>
                  setFilters({ when: todayItems.length ? "today" : "week" })
                }
              />
            )
          }
        />
        {soonLoading ? (
          <BentoSkeleton />
        ) : soonItems.length ? (
          <HappeningBento events={soonItems} />
        ) : (
          <EmptyNote text={`Nothing on this week ${inLabel}.`} />
        )}
      </section>

      <section className="space-y-6">
        <SectionHeader
          icon={Flame}
          eyebrow="What people are booking"
          title="Trending"
          action={
            trendingItems.length > 0 && (
              <SeeAll onClick={() => setFilters({ show: "trending" })} />
            )
          }
        />
        {trendingItems.length ? (
          <TrendingChart events={trendingItems} />
        ) : trending.data ? (
          <EmptyNote text={`Nothing trending ${inLabel} yet.`} />
        ) : (
          <Skeleton className="h-64 rounded-3xl" />
        )}
      </section>

      {performers.length > 0 && (
        <section className="space-y-8 rounded-[2rem] bg-linear-to-br from-white via-white to-secondary-50 p-4 ring-1 ring-black/5 sm:rounded-[2.5rem] sm:p-6 md:p-10">
          <SectionHeader
            icon={Mic2}
            eyebrow="By tickets sold this year"
            title={chartTitle}
            withPlace={false}
            action={
              <SeeAll
                href={`${ROUTES.EXPLORE.href}/charts`}
                label="Full charts"
              />
            }
          />
          <PerformerPodium performers={performers} />
        </section>
      )}

      {venues.data && (
        <section className="space-y-6">
          <SectionHeader
            icon={MapPin}
            eyebrow="Where it happens"
            title="Venues"
            action={
              venueItems.length > 0 && (
                <SeeAll onClick={() => setFilters({ tab: "venues" })} />
              )
            }
          />
          {venueItems.length ? (
            <VenueCollage venues={venueItems} />
          ) : (
            <EmptyNote text={`No venues listed ${inLabel} yet.`} />
          )}
        </section>
      )}

      {planners.length > 0 && (
        <section className="space-y-6">
          <SectionHeader
            icon={Users}
            eyebrow="Who puts it on"
            title="Event planners"
            withPlace={false}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {planners.map((planner) => (
              <div
                key={planner.id}
                className="flex items-center gap-4 rounded-3xl bg-white p-4 ring-1 ring-black/5"
              >
                <PerformerAvatar
                  name={planner.name}
                  image={planner.image}
                  className="size-14"
                />
                <Link
                  href={`${ROUTES.EXPLORE.href}/planner/${planner.id}`}
                  className="min-w-0 flex-1"
                >
                  <span className="block truncate font-bold text-secondary-950 hover:text-secondary">
                    {planner.name}
                  </span>
                  <span className="block text-xs text-secondary-500">
                    {planner.upcomingEvents} upcoming{" "}
                    {planner.upcomingEvents === 1 ? "event" : "events"}
                  </span>
                </Link>
                <FollowButton
                  type="PLANNER"
                  id={planner.id}
                  name={planner.name}
                  className="h-9 px-4 text-sm"
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default memo(ExploreBrowse);
