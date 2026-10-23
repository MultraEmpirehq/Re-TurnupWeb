"use client";

import EventsGrid from "@/components/discovery/events-grid";
import FollowButton from "@/components/discovery/follow-button";
import PerformerAvatar from "@/components/discovery/performer-avatar";
import SectionContainer from "@/components/layouts/section-container/section-container";
import ExploreBackLink from "@/components/pages/explore/explore-back-link";
import { useEvents } from "@/hooks/use-event";
import { usePlanners } from "@/hooks/use-discovery";
import { useParams } from "next/navigation";
import React, { memo } from "react";

/**
 * An event planner (an organiser) and their upcoming events. There's no planner
 * endpoint of its own, so the name and picture come from the planners list, or
 * from their latest event.
 */
const PlannerPage = () => {
  const params = useParams();
  const id = params?.id?.toString() ?? "";
  const { data: planners } = usePlanners("", 100);
  const { data: events } = useEvents({ organizerId: id, limit: 1 });
  const listed = planners?.find((planner) => planner.id === id);
  const latest = events?.pages?.[0]?.data?.[0];
  const name = listed?.name || latest?.organizerName || "Event planner";
  const image = listed?.image ?? latest?.image ?? null;

  return (
    <SectionContainer className="space-y-12 py-16">
      <ExploreBackLink />
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <PerformerAvatar
            name={name}
            image={image}
            className="size-24 text-2xl"
          />
          <div className="space-y-1.5">
            <p className="text-xs font-semibold tracking-[0.2em] text-secondary uppercase">
              Event planner
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-secondary-950">
              {name}
            </h1>
            {listed && (
              <p className="text-sm text-secondary-500">
                {listed.upcomingEvents} upcoming{" "}
                {listed.upcomingEvents === 1 ? "event" : "events"}
              </p>
            )}
          </div>
        </div>
        <FollowButton type="PLANNER" id={id} name={name} />
      </header>

      <section className="space-y-5">
        <h2 className="text-xl font-bold text-secondary-950">
          Upcoming events
        </h2>
        <EventsGrid
          params={{ organizerId: id }}
          emptyText="Nothing coming up from this planner right now."
        />
      </section>
    </SectionContainer>
  );
};

export default memo(PlannerPage);
