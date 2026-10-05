"use client";

import SectionContainer from "@/components/layouts/section-container/section-container";
import { Search, X } from "lucide-react";
import React, { memo, useEffect, useRef, useState } from "react";
import Spotlight from "./spotlight";
import useExploreFilters from "./use-explore-filters";

// Fixed positions so the server and the browser draw the same sky.
const STARS = Array.from({ length: 22 }, (_, index) => ({
  top: `${(index * 41 + 7) % 100}%`,
  left: `${(index * 67 + 11) % 100}%`,
  size: index % 4 === 0 ? 3 : 2,
  delay: `${(index % 6) * 0.7}s`,
}));

const ExploreBannerComponent = () => {
  const { q, setFilters } = useExploreFilters();
  const [search, setSearch] = useState(q);
  const lastSent = useRef(q);

  // Typing updates the url (and so the results) once the person pauses.
  useEffect(() => {
    const value = search.trim();
    if (value === lastSent.current) return;
    const timer = setTimeout(() => {
      lastSent.current = value;
      setFilters({ q: value || undefined });
    }, 350);
    return () => clearTimeout(timer);
  }, [search, setFilters]);

  // Keeps the box in step when the url changes elsewhere, such as "Clear filters".
  useEffect(() => {
    if (q !== lastSent.current) {
      lastSent.current = q;
      setSearch(q);
    }
  }, [q]);

  return (
    <section className="relative isolate overflow-hidden bg-secondary-950">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {STARS.map((star, index) => (
          <span
            key={index}
            className="animate-landing-twinkle absolute rounded-full bg-white"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              animationDelay: star.delay,
            }}
          />
        ))}
        <div className="absolute -top-48 left-1/4 size-[32rem] rounded-full bg-secondary/25 blur-[120px]" />
        <div className="absolute -right-32 -bottom-56 size-[34rem] rounded-full bg-primary/25 blur-[130px]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* Extra room at the bottom: the date strip rides up over the banner. */}
      <SectionContainer className="grid items-center gap-12 pt-32 pb-32 md:pt-40 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <div className="flex flex-col items-start gap-7">
          <div className="space-y-4">
            <p className="text-sm font-semibold tracking-wider text-primary-300 uppercase">
              Explore
            </p>
            <h1 className="text-4xl leading-[1.05] font-bold tracking-tight text-white sm:text-6xl">
              Your city,
              <br />
              <span className="bg-linear-to-r from-secondary-300 via-primary-300 to-primary bg-clip-text text-transparent">
                after dark.
              </span>
            </h1>
            <p className="max-w-md text-white/60">
              Concerts, owambes, comedy, food, art and more. Pick a day, pick a
              vibe, grab a ticket.
            </p>
          </div>

          <form
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              lastSent.current = search.trim();
              setFilters({ q: search.trim() || undefined });
            }}
            className="group flex w-full max-w-[560px] items-center gap-3 rounded-full bg-white/[0.08] py-2 pr-2 pl-5 ring-1 ring-white/15 backdrop-blur-xl transition-all duration-300 focus-within:bg-white/[0.12] focus-within:ring-white/35"
          >
            <Search className="size-5 shrink-0 text-white/60" aria-hidden />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search events by name"
              aria-label="Search events"
              className="h-10 min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/45"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" />
              </button>
            )}
            <button
              type="submit"
              className="h-10 shrink-0 rounded-full bg-white px-5 text-sm font-semibold text-secondary-950 transition-colors hover:bg-white/90"
            >
              Search
            </button>
          </form>
        </div>

        <div className="mx-auto w-full max-w-[380px] lg:mx-0 lg:ml-auto">
          <Spotlight />
        </div>
      </SectionContainer>
    </section>
  );
};

export default memo(ExploreBannerComponent);
