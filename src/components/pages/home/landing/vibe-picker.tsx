"use client";

import SectionContainer from "@/components/layouts/section-container/section-container";
import { Button } from "@/components/ui/button";
import useCategory from "@/hooks/use-category";
import { useEvents } from "@/hooks/use-event";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/variables";
import { ArrowRight, CalendarSearch } from "lucide-react";
import Link from "next/link";
import React, { memo, useMemo, useState } from "react";
import Reveal from "./reveal";
import TicketCard, { TicketCardSkeleton } from "./ticket-card";

/** Pick a category and the board below swaps to upcoming events in it. */
const VibePicker = () => {
  const { data: categories } = useCategory();
  const [categoryId, setCategoryId] = useState<string>();
  const { data, isLoading } = useEvents({
    limit: 6,
    status: "UPCOMING",
    categoryId,
  });
  const events = useMemo(
    () => (data?.pages?.flatMap((page) => page?.data || []) || []).slice(0, 6),
    [data],
  );
  const pills = useMemo(
    () => [{ id: undefined, name: "Everything" }, ...categories.slice(0, 8)],
    [categories],
  );

  return (
    <section className="bg-[#f7f9fc] py-20 [--ticket-notch:#f7f9fc] md:py-28">
      <SectionContainer className="space-y-10">
        <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl space-y-3">
            <p className="text-sm font-semibold tracking-wider text-primary uppercase">
              Pick a vibe
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-secondary-950 md:text-5xl">
              What are you in the mood for?
            </h2>
          </div>
          <Button
            asChild
            variant="ghost"
            className="group w-fit rounded-full px-0 text-secondary-900 hover:bg-transparent"
          >
            <Link href={ROUTES.EXPLORE.href}>
              See every event
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
        </Reveal>

        <Reveal delay={80}>
          <div
            role="tablist"
            aria-label="Event categories"
            className="scrollbar-none -mx-horizontal flex gap-2 overflow-x-auto px-horizontal pb-1 md:mx-0 md:flex-wrap md:px-0"
          >
            {pills.map((pill) => {
              const isActive = pill.id === categoryId;
              return (
                <button
                  key={pill.id ?? "all"}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setCategoryId(pill.id)}
                  className={cn(
                    "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300",
                    isActive
                      ? "border-secondary-950 bg-secondary-950 text-white shadow-[0_8px_20px_-10px_rgba(2,6,23,0.6)]"
                      : "border-secondary-100 bg-white text-secondary-800 hover:-translate-y-0.5 hover:border-secondary-300",
                  )}
                >
                  {pill.name}
                </button>
              );
            })}
          </div>
        </Reveal>

        <div
          aria-live="polite"
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {isLoading &&
            Array.from({ length: 3 }).map((_, index) => (
              <TicketCardSkeleton key={index} />
            ))}

          {!isLoading &&
            events.map((event, index) => (
              <Reveal
                key={`${categoryId ?? "all"}-${event.id}`}
                delay={index * 70}
                // Three is plenty on a phone; the rest are a scroll too far.
                className={cn(index >= 3 && "hidden sm:block")}
              >
                <TicketCard event={event} />
              </Reveal>
            ))}

          {!isLoading && events.length === 0 && (
            <div className="col-span-full flex flex-col items-center gap-3 rounded-3xl border border-dashed border-secondary-200 bg-white px-6 py-14 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-secondary-50 text-secondary-800">
                <CalendarSearch className="size-5" aria-hidden />
              </span>
              <p className="font-semibold text-secondary-950">
                Nothing coming up here yet
              </p>
              <p className="max-w-sm text-sm text-secondary-950/60">
                New events land every week. Try another vibe, or browse
                everything on Explore.
              </p>
            </div>
          )}
        </div>
      </SectionContainer>
    </section>
  );
};

export default memo(VibePicker);
