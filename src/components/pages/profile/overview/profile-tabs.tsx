"use client";

import { getData } from "@/api";
import CustomImageComponent from "@/components/ui/custom-image.component";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvents } from "@/hooks/use-event";
import { formatEventDateRange, formatEventTime } from "@/lib/event-time";
import { IEventDetailsType, UserTicketDetailsResponseType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/variables";
import { useQuery } from "@tanstack/react-query";
import {
  Bookmark,
  Camera,
  ChevronRight,
  ImageIcon,
  Tag,
  TicketIcon,
} from "lucide-react";
import Link from "next/link";
import React, { memo, useMemo, useState } from "react";

type TTab = "tickets" | "saved" | "posts" | "tagged";

/** An event counts as past six hours after it starts (after its last day, if it has several). */
const isPast = (event: IEventDetailsType) =>
  new Date(event.endDate ?? event.date).getTime() < Date.now() - 6 * 3_600_000;

const whenOf = (event: IEventDetailsType) =>
  (event.days?.length ?? 0) > 1 && event.endDate
    ? formatEventDateRange(event.date, event.endDate, event.timezone)
    : formatEventTime(event.date, event.timezone, { withYear: false });

const placeOf = (event: IEventDetailsType) =>
  event.venue?.name ?? event.venueName ?? event.eventCity ?? null;

/** Every ticket they hold, not just the first page. */
const useAllMyTickets = () =>
  useQuery({
    queryKey: ["user-tickets", "all"],
    queryFn: async () =>
      (
        await getData<UserTicketDetailsResponseType[]>(
          "/tickets/user?limit=100",
        )
      ).data?.data ?? [],
  });

const EventRow: React.FC<{
  event: IEventDetailsType;
  href: string;
  note?: string;
  past?: boolean;
}> = ({ event, href, note, past }) => (
  <Link
    href={href}
    className={cn(
      "group flex items-center gap-4 rounded-2xl border border-secondary-100 bg-white p-3 transition-colors hover:border-primary/40",
      past && "opacity-75",
    )}
  >
    <span className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-xl bg-secondary-100 sm:w-36">
      {(event.image || event.medias?.[0]) && (
        <CustomImageComponent
          src={(event.image || event.medias?.[0])!}
          alt=""
          fill
          className="size-full"
          imageClassName={cn("object-cover", past && "grayscale-[40%]")}
        />
      )}
    </span>
    <span className="min-w-0 flex-1">
      <span className="line-clamp-2 block font-bold text-secondary-950">
        {event.name}
      </span>
      <span className="mt-0.5 block truncate text-sm text-secondary-500">
        {whenOf(event)}
      </span>
      {placeOf(event) && (
        <span className="block truncate text-sm text-secondary-500">
          {placeOf(event)}
        </span>
      )}
      {note && (
        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-secondary-700">
          <TicketIcon className="size-3" aria-hidden />
          {note}
        </span>
      )}
    </span>
    <ChevronRight
      className="size-4 shrink-0 text-secondary-300 group-hover:text-secondary-600"
      aria-hidden
    />
  </Link>
);

const Empty: React.FC<{
  icon: React.ElementType;
  title: string;
  body: string;
}> = ({ icon: Icon, title, body }) => (
  <div className="rounded-[1.5rem] border border-dashed border-secondary-200 bg-white px-6 py-14 text-center">
    <Icon className="mx-auto size-8 text-secondary-300" aria-hidden />
    <p className="mt-3 font-bold text-secondary-950">{title}</p>
    <p className="mx-auto mt-1 max-w-sm text-sm text-secondary-500">{body}</p>
  </div>
);

/**
 * The events side of their profile, as on the app: the events they hold tickets
 * for (coming up first, then past), what they saved, and Posts and Tagged, which
 * are on their way.
 */
const ProfileTabs: React.FC = () => {
  const [tab, setTab] = useState<TTab>("tickets");
  const { data: tickets = [], isLoading: ticketsLoading } = useAllMyTickets();
  const { data: savedPages, isLoading: savedLoading } = useEvents({
    isFavorite: true,
    limit: 50,
  });

  const { upcoming, past, ticketCount } = useMemo(() => {
    const byEvent = new Map<
      string,
      { event: IEventDetailsType; count: number }
    >();
    for (const ticket of tickets) {
      const event = ticket.ticket?.event;
      if (!event?.id || ticket.registrationStatus === "REJECTED") continue;
      const entry = byEvent.get(event.id);
      if (entry) entry.count += 1;
      else byEvent.set(event.id, { event, count: 1 });
    }
    const all = [...byEvent.values()];
    return {
      upcoming: all
        .filter((item) => !isPast(item.event))
        .sort((a, b) => +new Date(a.event.date) - +new Date(b.event.date)),
      past: all
        .filter((item) => isPast(item.event))
        .sort((a, b) => +new Date(b.event.date) - +new Date(a.event.date)),
      ticketCount: all.reduce((sum, item) => sum + item.count, 0),
    };
  }, [tickets]);
  const saved = useMemo(
    () => savedPages?.pages?.flatMap((page) => page?.data ?? []) ?? [],
    [savedPages],
  );

  const tabs: {
    id: TTab;
    label: string;
    count: number;
    icon: React.ElementType;
  }[] = [
    { id: "tickets", label: "Tickets", count: ticketCount, icon: TicketIcon },
    { id: "saved", label: "Saved", count: saved.length, icon: Bookmark },
    { id: "posts", label: "Posts", count: 0, icon: ImageIcon },
    { id: "tagged", label: "Tagged", count: 0, icon: Tag },
  ];
  const noteFor = (item: { event: IEventDetailsType; count: number }) =>
    item.event.saleMethod === "register"
      ? "Free pass"
      : `${item.count} ${item.count === 1 ? "ticket" : "tickets"}`;
  const loading =
    tab === "tickets" ? ticketsLoading : tab === "saved" ? savedLoading : false;

  return (
    <section className="min-w-0 space-y-4">
      <div
        role="tablist"
        aria-label="Your events"
        className="scrollbar-none flex gap-1 overflow-x-auto border-b border-secondary-100"
      >
        {tabs.map((item) => {
          const on = item.id === tab;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(item.id)}
              className={cn(
                "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 pb-3 text-sm font-bold transition-colors sm:px-4",
                on
                  ? "border-secondary-900 text-secondary-950"
                  : "border-transparent text-secondary-500 hover:text-secondary-800",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {item.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs tabular-nums",
                  on
                    ? "bg-secondary-900 text-white"
                    : "bg-secondary-50 text-secondary-500",
                )}
              >
                {item.count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid gap-3 @3xl:grid-cols-2">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : tab === "tickets" ? (
        upcoming.length || past.length ? (
          <div className="space-y-6">
            {upcoming.length > 0 && (
              <div className="grid gap-3 @3xl:grid-cols-2">
                {upcoming.map((item) => (
                  <EventRow
                    key={item.event.id}
                    event={item.event}
                    note={noteFor(item)}
                    href={ROUTES.PROFILE_TICKETS.href}
                  />
                ))}
              </div>
            )}
            {past.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-extrabold tracking-[0.18em] text-secondary-400">
                  PAST
                </p>
                <div className="grid gap-3 @3xl:grid-cols-2">
                  {past.map((item) => (
                    <EventRow
                      key={item.event.id}
                      event={item.event}
                      note={noteFor(item)}
                      href={`${ROUTES.EXPLORE.href}/event/${item.event.id}`}
                      past
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Empty
            icon={TicketIcon}
            title="No tickets yet"
            body="Tickets you buy and free events you register for will show here."
          />
        )
      ) : tab === "saved" ? (
        saved.length ? (
          <div className="grid gap-3 @3xl:grid-cols-2">
            {saved.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                href={`${ROUTES.EXPLORE.href}/event/${event.id}`}
                past={isPast(event)}
              />
            ))}
          </div>
        ) : (
          <Empty
            icon={Bookmark}
            title="Nothing saved yet"
            body="Save events from Explore to keep them here."
          />
        )
      ) : tab === "posts" ? (
        <Empty
          icon={Camera}
          title="Posts are coming soon"
          body="You'll be able to share photos from events you went to."
        />
      ) : (
        <Empty
          icon={Tag}
          title="Tagged is coming soon"
          body="Photos friends tag you in will show here."
        />
      )}
    </section>
  );
};

export default memo(ProfileTabs);
