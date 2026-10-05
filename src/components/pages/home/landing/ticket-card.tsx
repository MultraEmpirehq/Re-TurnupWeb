"use client";

import CustomImageComponent from "@/components/ui/custom-image.component";
import { Skeleton } from "@/components/ui/skeleton";
import { IEventDetailsType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/variables";
import { formatDate } from "date-fns";
import { MapPin } from "lucide-react";
import Link from "next/link";
import React, { memo, useRef } from "react";

const placeOf = (event: IEventDetailsType) =>
  event.venue?.name ||
  event.venueName ||
  event.eventCity ||
  event.city ||
  event.eventState ||
  "Venue to be announced";

/**
 * An event drawn as a ticket stub: the poster, a torn perforation, then the date.
 * It leans toward the pointer a little, like a ticket picked up off a table.
 */
const TicketCard: React.FC<{
  event: IEventDetailsType;
  className?: string;
  tilt?: boolean;
  /** Fills its grid cell, with the poster taking the spare height. */
  featured?: boolean;
}> = ({ event, className, tilt = true, featured = false }) => {
  const ref = useRef<HTMLAnchorElement>(null);
  const date = event.date ? new Date(event.date) : null;
  const hasDate = !!date && !Number.isNaN(date.getTime());

  const handleMove = (pointer: React.PointerEvent<HTMLAnchorElement>) => {
    const node = ref.current;
    if (!tilt || !node || pointer.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = node.getBoundingClientRect();
    const x = (pointer.clientX - box.left) / box.width - 0.5;
    const y = (pointer.clientY - box.top) / box.height - 0.5;
    node.style.transform = `perspective(900px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) translateY(-4px)`;
  };

  const reset = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <Link
      ref={ref}
      href={`${ROUTES.EXPLORE.href}/event/${event.id}`}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_12px_32px_-16px_rgba(15,23,42,0.25)] ring-1 ring-black/5 transition-[transform,box-shadow] duration-300 ease-out will-change-transform hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_24px_48px_-20px_rgba(15,23,42,0.35)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary",
        className,
      )}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden bg-secondary-50",
          featured ? "min-h-[260px] flex-1" : "aspect-[4/3]",
        )}
      >
        <CustomImageComponent
          fill
          src={event.image}
          alt={event.name}
          className="size-full rounded-none"
          imageClassName="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        {event.category?.name && (
          <span className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-secondary-900 backdrop-blur">
            {event.category.name}
          </span>
        )}
      </div>

      {/* The perforation: two notches and a dashed tear line. */}
      <div className="relative h-0" aria-hidden>
        <span className="absolute -top-3 -left-3 size-6 rounded-full bg-[var(--ticket-notch,white)] ring-1 ring-black/5" />
        <span className="absolute -top-3 -right-3 size-6 rounded-full bg-[var(--ticket-notch,white)] ring-1 ring-black/5" />
        <span className="absolute inset-x-5 top-0 border-t-2 border-dashed border-secondary-100" />
      </div>

      <div className="flex items-center gap-4 px-5 pt-5 pb-5">
        <div className="flex w-12 shrink-0 flex-col items-center rounded-2xl bg-secondary-50 py-2 text-secondary-900">
          <span className="text-[11px] font-semibold tracking-wider uppercase">
            {hasDate ? formatDate(date, "MMM") : "TBA"}
          </span>
          <span className="text-xl leading-none font-bold">
            {hasDate ? formatDate(date, "dd") : "--"}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              "truncate font-semibold text-secondary-950",
              featured && "text-lg sm:text-xl",
            )}
          >
            {event.name || "Untitled event"}
          </h3>
          <p className="mt-1 flex items-center gap-1 truncate text-sm text-secondary-950/60">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{placeOf(event)}</span>
          </p>
        </div>
      </div>
    </Link>
  );
};

export const TicketCardSkeleton: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div
    className={cn(
      "flex flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-black/5",
      className,
    )}
  >
    <Skeleton className="aspect-[4/3] w-full rounded-none" />
    <div className="flex items-center gap-4 p-5">
      <Skeleton className="h-14 w-12 rounded-2xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  </div>
);

export default memo(TicketCard);
