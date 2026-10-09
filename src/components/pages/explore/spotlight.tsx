"use client";

import CustomImageComponent from "@/components/ui/custom-image.component";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvents } from "@/hooks/use-event";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/variables";
import { formatDate } from "date-fns";
import { ArrowUpRight, MapPin } from "lucide-react";
import Link from "next/link";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";

const STORY_MS = 5000;

/**
 * Trending events told like stories: one at a time, with a bar along the top
 * filling as each plays. Tap the left or right of the card to go back or on;
 * hovering holds the current one.
 */
const Spotlight = () => {
  const { data, isLoading } = useEvents({ limit: 5, isTrending: true });
  const events = useMemo(
    () =>
      (data?.pages?.flatMap((page) => page?.data || []) || [])
        .filter((event) => !!event?.image)
        .slice(0, 5),
    [data],
  );
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  // Each story runs its bar with the web animations api, so pausing freezes the
  // bar exactly where it is and the next story starts when it finishes.
  useEffect(() => {
    const bar = barRef.current;
    if (!bar || events.length < 2 || reducedMotion) return;
    const animation = bar.animate(
      [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
      { duration: STORY_MS, easing: "linear", fill: "forwards" },
    );
    animation.onfinish = () =>
      setIndex((current) => (current + 1) % events.length);
    return () => animation.cancel();
  }, [index, events.length, reducedMotion]);

  useEffect(() => {
    const bar = barRef.current;
    bar
      ?.getAnimations()
      .forEach((animation) =>
        isPaused ? animation.pause() : animation.play(),
      );
  }, [isPaused, index]);

  if (isLoading) {
    return (
      <Skeleton className="aspect-[4/5] w-full rounded-[2rem] bg-secondary-100" />
    );
  }
  if (!events.length) return null;

  const event = events[Math.min(index, events.length - 1)];
  const date = event.date ? new Date(event.date) : null;
  const hasDate = !!date && !Number.isNaN(date.getTime());
  const go = (step: number) =>
    setIndex((current) => (current + step + events.length) % events.length);

  return (
    <div
      onPointerEnter={() => setIsPaused(true)}
      onPointerLeave={() => setIsPaused(false)}
      className="group relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] bg-secondary-900 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)] ring-1 ring-white/10"
    >
      {events.map((item, itemIndex) => (
        <div
          key={item.id}
          aria-hidden={itemIndex !== index}
          className={cn(
            "absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
            itemIndex === index
              ? "scale-100 opacity-100"
              : "scale-105 opacity-0",
          )}
        >
          <CustomImageComponent
            fill
            src={item.image}
            alt={item.name}
            className="size-full rounded-none"
            imageClassName="object-cover"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-linear-to-t from-secondary-950 via-secondary-950/30 to-secondary-950/40" />

      {/* Progress: one segment per story. */}
      <div className="absolute inset-x-4 top-4 flex gap-1.5">
        {events.map((item, itemIndex) => (
          <span
            key={item.id}
            className="h-1 flex-1 overflow-hidden rounded-full bg-white/25"
          >
            {itemIndex < index && (
              <span className="block h-full w-full bg-white" />
            )}
            {itemIndex === index && (
              <span
                ref={barRef}
                className={cn(
                  "block h-full w-full origin-left bg-white",
                  !reducedMotion && "scale-x-0",
                )}
              />
            )}
          </span>
        ))}
      </div>
      <div className="absolute top-8 left-4 flex items-center gap-2 text-xs font-semibold text-white">
        <span className="rounded-full bg-primary px-2 py-0.5">Trending</span>
        <span className="text-white/70">
          {index + 1} of {events.length}
        </span>
      </div>

      {/* Tap zones for back and next, under the details. */}
      <button
        type="button"
        aria-label="Previous event"
        onClick={() => go(-1)}
        className="absolute inset-y-0 left-0 w-1/3"
      />
      <button
        type="button"
        aria-label="Next event"
        onClick={() => go(1)}
        className="absolute inset-y-0 right-0 w-1/3"
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 space-y-3 p-6">
        {event.category?.name && (
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            {event.category.name}
          </span>
        )}
        <h3
          key={event.id}
          className="text-2xl leading-tight font-bold text-white"
        >
          {event.name}
        </h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/70">
          {hasDate && <span>{formatDate(date, "EEE d MMM, h:mm a")}</span>}
          {(event.venue?.name || event.venueName) && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden />
              {event.venue?.name || event.venueName}
            </span>
          )}
        </div>
        <Link
          href={`${ROUTES.EXPLORE.href}/event/${event.id}`}
          className="pointer-events-auto inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-secondary-950 transition-colors hover:bg-white/90"
        >
          Get tickets
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
};

export default memo(Spotlight);
