"use client";

import CustomImageComponent from "@/components/ui/custom-image.component";
import SectionContainer from "@/components/layouts/section-container/section-container";
import { useEvents } from "@/hooks/use-event";
import { ROUTES } from "@/lib/variables";
import Link from "next/link";
import React, { memo, useMemo } from "react";
import Reveal from "./reveal";

/** A slow reel of past events. It pauses under the pointer so one can be opened. */
const PastMarquee = () => {
  const { data } = useEvents({ limit: 12, status: "PAST" });
  const events = useMemo(
    () =>
      (data?.pages?.flatMap((page) => page?.data || []) || []).filter(
        (event) => !!event?.image,
      ),
    [data],
  );

  if (events.length < 4) return null;

  // Two copies back to back, so sliding by half loops without a seam.
  const reel = [...events, ...events];

  return (
    <section className="overflow-hidden bg-[#f7f9fc] py-20 md:py-24">
      <SectionContainer>
        <Reveal className="mb-10 max-w-xl space-y-3">
          <p className="text-sm font-semibold tracking-wider text-primary uppercase">
            Recently turned up
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-secondary-950 md:text-5xl">
            Nights people are still talking about.
          </h2>
        </Reveal>
      </SectionContainer>

      {/* Tipped back a little, like a reel running away from you. The tilt sits on
          the masked box itself so the fade never clips the tipped cards. */}
      <div className="group relative py-6 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] [transform:perspective(1400px)_rotateX(14deg)_rotateZ(-2deg)] [transform-origin:50%_100%]">
        <ul className="animate-landing-marquee flex w-max gap-5 group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]">
          {reel.map((event, index) => (
            <li
              key={`${event.id}-${index}`}
              aria-hidden={index >= events.length}
              className="w-[260px] shrink-0"
            >
              <Link
                href={`${ROUTES.EXPLORE.href}/event/${event.id}`}
                tabIndex={index >= events.length ? -1 : undefined}
                className="group/item relative block aspect-[4/5] overflow-hidden rounded-3xl"
              >
                <CustomImageComponent
                  fill
                  src={event.image}
                  alt={event.name}
                  className="size-full rounded-none"
                  imageClassName="object-cover grayscale-[35%] transition-all duration-700 group-hover/item:scale-105 group-hover/item:grayscale-0"
                />
                <div className="absolute inset-0 bg-linear-to-t from-secondary-950/85 via-secondary-950/10 to-transparent" />
                <p className="absolute inset-x-4 bottom-4 line-clamp-2 font-semibold text-white">
                  {event.name}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default memo(PastMarquee);
