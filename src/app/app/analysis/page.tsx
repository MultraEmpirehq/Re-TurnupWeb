"use client";

import { useEvents } from "@/hooks/use-event";
import DashboardTicketSalesChart from "@/components/pages/app/dashboard-ticket-sales-chart";
import { Button } from "@/components/ui/button";
import { IEventDetailsType, IMonthlyTicketsSold } from "@/lib/types";
import useUserStore from "@/stores/user-store";
import Link from "next/link";
import React, { memo, useMemo } from "react";

const formatMetricValue = (value: number) => {
  return value.toLocaleString();
};

const isUpcomingEvent = (event: IEventDetailsType) => {
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

const MetricCard: React.FC<{
  title: string;
  value: string;
  caption: string;
  pill: string;
}> = ({ title, value, caption, pill }) => {
  return (
    <article className="relative overflow-hidden rounded-[1.6rem] border border-secondary-100 bg-white px-5 py-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:rounded-[2rem] sm:px-7 sm:py-6 lg:px-8 lg:py-7">
      <div className="absolute -bottom-8 -right-8 size-24 rounded-full bg-secondary-50/80 sm:-bottom-10 sm:-right-10 sm:size-32" />
      <div className="relative space-y-4">
        <p className="text-sm text-secondary-500">{title}</p>
        <p className="text-3xl font-bold tracking-tight text-secondary-950 sm:text-4xl">
          {value}
        </p>
        <div className="flex flex-col items-start gap-2 text-sm text-secondary-400 sm:flex-row sm:items-center sm:gap-3">
          <span className="rounded-full bg-secondary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-secondary-500">
            {pill}
          </span>
          <span>{caption}</span>
        </div>
      </div>
    </article>
  );
};

const InsightCard: React.FC<{
  title: string;
  subtitle: string;
  value: string;
  caption: string;
}> = ({ title, subtitle, value, caption }) => {
  return (
    <article className="rounded-[1.8rem] border border-secondary-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary-400">
        {subtitle}
      </p>
      <h2 className="mt-3 text-xl font-bold text-secondary-950">{title}</h2>
      <p className="mt-5 text-3xl font-bold tracking-tight text-secondary-950">
        {value}
      </p>
      <p className="mt-3 text-sm leading-7 text-secondary-500">{caption}</p>
    </article>
  );
};

const EventReactionCard: React.FC<{ event: IEventDetailsType }> = ({ event }) => {
  const engagementScore = getEngagementScore(event);

  return (
    <article className="rounded-[1.8rem] border border-secondary-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary-400">
            User Reaction
          </p>
          <h3 className="mt-3 text-xl font-bold leading-tight text-secondary-950">
            {event.name}
          </h3>
        </div>
        <span className="rounded-full bg-secondary-50 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-secondary-400">
          {isUpcomingEvent(event) ? "Live" : "Archive"}
        </span>
      </div>

      <div className="mt-5 overflow-hidden rounded-[1rem] border border-secondary-100 bg-secondary-50/70">
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0 text-sm">
          <div className="border-b border-secondary-100 px-4 py-3 font-semibold text-secondary-950">
            Interest Score
          </div>
          <div className="border-b border-secondary-100 px-4 py-3 text-secondary-500">
            {engagementScore.toLocaleString()}
          </div>

          <div className="border-b border-secondary-100 px-4 py-3 font-semibold text-secondary-950">
            Guests
          </div>
          <div className="border-b border-secondary-100 px-4 py-3 text-secondary-500">
            {(event.eventGuestsOfHonour?.length ?? 0).toLocaleString()}
          </div>

          <div className="border-b border-secondary-100 px-4 py-3 font-semibold text-secondary-950">
            Activities
          </div>
          <div className="border-b border-secondary-100 px-4 py-3 text-secondary-500">
            {(event.activities?.length ?? 0).toLocaleString()}
          </div>

          <div className="border-b border-secondary-100 px-4 py-3 font-semibold text-secondary-950">
            Media
          </div>
          <div className="border-b border-secondary-100 px-4 py-3 text-secondary-500">
            {(event.medias?.length ?? 0).toLocaleString()}
          </div>

          <div className="px-4 py-3 font-semibold text-secondary-950">Tickets</div>
          <div className="px-4 py-3 text-secondary-500">
            {(event.totalTickets ?? 0).toLocaleString()} published
          </div>
        </div>
      </div>
    </article>
  );
};

const TopPerformingEventCard: React.FC<{ event: IEventDetailsType | null }> = ({
  event,
}) => {
  if (!event) {
    return (
      <article className="rounded-[1.8rem] border border-secondary-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary-400">
          Top Performer
        </p>
        <h2 className="mt-3 text-2xl font-bold text-secondary-950">
          No live event yet
        </h2>
        <p className="mt-3 text-sm leading-7 text-secondary-500">
          Create and publish an event to unlock a featured live-performance block here.
        </p>
      </article>
    );
  }

  return (
    <article className="rounded-[1.8rem] border border-secondary-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary-400">
            Top Performing Live Event
          </p>
          <h2 className="mt-3 text-2xl font-bold leading-tight text-secondary-950">
            {event.name}
          </h2>
          <p className="mt-3 text-sm leading-7 text-secondary-500">
            {event.description ||
              "This event is currently carrying the strongest live momentum in your Turnupz vendor workspace."}
          </p>
        </div>
        <span className="rounded-full bg-secondary-50 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-secondary-400">
          Live
        </span>
      </div>

      <div className="mt-6 overflow-hidden rounded-[1rem] border border-secondary-100 bg-secondary-50/70">
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0 text-sm">
          <div className="border-b border-secondary-100 px-4 py-3 font-semibold text-secondary-950">
            Engagement
          </div>
          <div className="border-b border-secondary-100 px-4 py-3 text-secondary-500">
            {getEngagementScore(event).toLocaleString()} score
          </div>

          <div className="border-b border-secondary-100 px-4 py-3 font-semibold text-secondary-950">
            Event Date
          </div>
          <div className="border-b border-secondary-100 px-4 py-3 text-secondary-500">
            {new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }).format(new Date(event.date))}
          </div>

          <div className="border-b border-secondary-100 px-4 py-3 font-semibold text-secondary-950">
            Venue
          </div>
          <div className="border-b border-secondary-100 px-4 py-3 text-secondary-500">
            {event.venue?.name || "Venue pending"}
          </div>

          <div className="px-4 py-3 font-semibold text-secondary-950">Tickets</div>
          <div className="px-4 py-3 text-secondary-500">
            {(event.totalTickets ?? 0).toLocaleString()} published
          </div>
        </div>
      </div>
    </article>
  );
};

export const dynamic = "force-dynamic";

const AnalysisPage = () => {
  const userId = useUserStore((state) => state?.userDetails?.id);
  const { data: eventsData } = useEvents({
    limit: 50,
    userId: userId ?? undefined,
  });

  const events = useMemo(
    () => eventsData?.pages?.flatMap((page) => page?.data ?? []) ?? [],
    [eventsData],
  );

  const metrics = useMemo(
    () => [
      {
        title: "Total Events",
        value: formatMetricValue(events.length),
        pill: "Live",
        caption: "Published across your Turnupz workspace",
      },
      {
        title: "Total Attendance",
        value: "0",
        pill: "Pending",
        caption: "Attendance metrics will activate once backend registrations are connected",
      },
      {
        title: "Total Revenue",
        value: "$0.00",
        pill: "Pending",
        caption: "Revenue metrics will activate once backend ticket sales are connected",
      },
    ],
    [events.length],
  );

  const liveEvents = useMemo(
    () => events.filter((event) => isUpcomingEvent(event)),
    [events],
  );

  const audienceReactionLeader = useMemo(() => {
    const source = liveEvents.length > 0 ? liveEvents : events;
    if (source.length === 0) {
      return null;
    }

    return [...source].sort(
      (left, right) => getEngagementScore(right) - getEngagementScore(left),
    )[0];
  }, [events, liveEvents]);

  const topPerformingLiveEvent = useMemo(() => {
    if (liveEvents.length === 0) {
      return null;
    }

    return [...liveEvents].sort(
      (left, right) => getEngagementScore(right) - getEngagementScore(left),
    )[0];
  }, [liveEvents]);

  const averageEngagementPerEvent = useMemo(() => {
    if (events.length === 0) {
      return 0;
    }

    const totalScore = events.reduce(
      (sum, event) => sum + getEngagementScore(event),
      0,
    );

    return Math.round(totalScore / events.length);
  }, [events]);

  const liveEventShare = useMemo(() => {
    if (events.length === 0) {
      return 0;
    }

    return Math.round((liveEvents.length / events.length) * 100);
  }, [events.length, liveEvents.length]);

  const publishedTickets = useMemo(() => {
    return events.reduce((sum, event) => sum + (event.totalTickets ?? 0), 0);
  }, [events]);

  const monthlyEventActivity = useMemo<IMonthlyTicketsSold[]>(() => {
    const bucket = new Map<string, number>();

    events.forEach((event) => {
      const eventDate = new Date(event.date);
      const key = `${eventDate.getFullYear()}-${eventDate.getMonth()}`;
      bucket.set(key, (bucket.get(key) ?? 0) + 1);
    });

    return [...bucket.entries()]
      .map(([key, count]) => {
        const [year, month] = key.split("-").map(Number);
        const date = new Date(year, month, 1);
        const label = new Intl.DateTimeFormat("en-US", {
          month: "short",
        }).format(date);

        return {
          month: key,
          label,
          count,
        };
      })
      .sort((left, right) => left.month.localeCompare(right.month));
  }, [events]);

  const strongestEvents = useMemo(
    () =>
      [...events]
        .sort((left, right) => getEngagementScore(right) - getEngagementScore(left))
        .slice(0, 4),
    [events],
  );

  const latestEvents = useMemo(
    () =>
      [...events]
        .sort(
          (left, right) =>
            new Date(right.date).getTime() - new Date(left.date).getTime(),
        )
        .slice(0, 5),
    [events],
  );

  return (
    <main className="space-y-10">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-secondary-400">
            Event Analytics
          </p>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-[0.96] tracking-tight text-secondary-950">
            Frontend event analytics preview
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-secondary-500 sm:text-base">
            This page is currently running in frontend-only mode. It uses your
            local event data and safe placeholder values until the backend is connected.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="h-12 rounded-2xl border-secondary-200 px-5 text-sm font-semibold text-secondary-950 hover:bg-secondary-50"
        >
          <Link href="/app">Back to Dashboard</Link>
        </Button>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary-400">
              Performance Overview
            </p>
            <h2 className="mt-3 text-[clamp(1.9rem,3vw,2.6rem)] font-bold tracking-tight text-secondary-950">
              Event growth and audience response
            </h2>
          </div>
          <Link
            href="/app/events"
            className="text-sm font-medium text-secondary-500 transition-colors hover:text-secondary-400"
          >
            View All Events
          </Link>
        </div>

        <article className="rounded-[1.8rem] border border-secondary-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-8">
          <div>
            <p className="text-sm leading-7 text-secondary-500">
              These frontend insights are derived from your created events,
              guests, activities, media, and published ticket counts.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <InsightCard
              title="Average engagement per event"
              subtitle="Audience"
              value={averageEngagementPerEvent.toLocaleString()}
              caption="Average local engagement score across your created events."
            />
            <InsightCard
              title="Live event share"
              subtitle="Momentum"
              value={`${liveEventShare}%`}
              caption="How much of your current event board is still upcoming."
            />
            <InsightCard
              title="Published tickets"
              subtitle="Inventory"
              value={publishedTickets.toLocaleString()}
              caption="Total ticket inventory currently attached to your created events."
            />
          </div>

          <div className="mt-8 rounded-[1.6rem] border border-secondary-100 bg-secondary-50/50 p-4 sm:p-6">
            <DashboardTicketSalesChart data={monthlyEventActivity} />
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <TopPerformingEventCard event={topPerformingLiveEvent} />

        <div className="space-y-6">
          {audienceReactionLeader ? (
            <EventReactionCard event={audienceReactionLeader} />
          ) : (
            <article className="rounded-[1.8rem] border border-secondary-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary-400">
                User Reaction
              </p>
              <h2 className="mt-3 text-xl font-bold text-secondary-950">
                No event reaction data yet
              </h2>
              <p className="mt-3 text-sm leading-7 text-secondary-500">
                Create your first event and frontend reaction signals will begin
                to build here.
              </p>
            </article>
          )}

          <article className="rounded-[1.8rem] bg-[#11172d] p-6 text-white shadow-[0_20px_50px_rgba(17,23,45,0.24)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/40">
              Frontend Mode
            </p>
            <h2 className="mt-4 text-3xl font-bold leading-tight">
              This analytics view is safe to design with now and easy to connect later.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/72 sm:text-base sm:leading-8">
              Once the backend is available, we can replace the placeholder
              attendance and revenue values with real registrations, sales,
              clicks, and reaction metrics without reworking the page design.
            </p>
          </article>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="rounded-[1.8rem] border border-secondary-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-secondary-950">
                Strongest event reactions
              </h2>
              <p className="mt-2 text-sm leading-7 text-secondary-500">
                Events with the strongest current frontend reaction signals.
              </p>
            </div>
            <span className="rounded-full bg-secondary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-secondary-500">
              {strongestEvents.length} tracked
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {strongestEvents.length === 0 && (
              <p className="text-sm text-secondary-500">
                No created events yet.
              </p>
            )}
            {strongestEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-[1.4rem] border border-secondary-100 bg-secondary-50/50 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-secondary-950">
                      {event.name}
                    </p>
                    <p className="mt-1 text-sm text-secondary-500">
                      {isUpcomingEvent(event) ? "Upcoming event" : "Past event"}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-secondary-500">
                    Score {getEngagementScore(event)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.8rem] border border-secondary-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-secondary-950">
                Latest created events
              </h2>
              <p className="mt-2 text-sm leading-7 text-secondary-500">
                Most recent event entries published into your Turnupz vendor workspace.
              </p>
            </div>
            <span className="rounded-full bg-secondary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-secondary-500">
              {latestEvents.length} shown
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {latestEvents.length === 0 && (
              <p className="text-sm text-secondary-500">
                No event activity yet.
              </p>
            )}
            {latestEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-[1.4rem] border border-secondary-100 bg-secondary-50/50 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-secondary-950">
                      {event.name}
                    </p>
                    <p className="mt-1 text-sm text-secondary-500">
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(event.date))}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-secondary-500">
                    {(event.totalTickets ?? 0).toLocaleString()} tickets
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
};

export default memo(AnalysisPage);
