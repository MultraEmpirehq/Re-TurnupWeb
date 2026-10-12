"use client";

import SectionContainer from "@/components/layouts/section-container/section-container";
import { Search, X } from "lucide-react";
import React, { memo, useEffect, useRef, useState } from "react";
import PassDeck from "./pass-deck";
import useExploreFilters from "./use-explore-filters";
import ExplorePlacePicker from "./explore-place-picker";

const ExploreBannerComponent = () => {
  const { q, tab, setFilters } = useExploreFilters();
  const placeholder = {
    events: "Search events, places, venues",
    venues: "Search venues by name",
    performers: "Search performers by name",
    places: "Search countries or cities",
  }[tab];
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
    // The app's light Explore: the same page colour and brand wash as sign-in.
    <section className="relative isolate overflow-hidden bg-[#f7fbff]">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-56 -left-40 size-[36rem] rounded-full bg-secondary/20 blur-[140px]" />
        <div className="absolute -right-32 -bottom-56 size-[34rem] rounded-full bg-primary/15 blur-[140px]" />
      </div>

      {/* Extra room at the bottom: the date strip rides up over the banner. */}
      <SectionContainer className="grid items-center gap-12 pt-12 pb-32 md:pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <div className="flex flex-col items-start gap-7">
          <div className="space-y-4">
            <p className="text-sm font-semibold tracking-wider text-primary uppercase">
              Explore
            </p>
            <h1 className="text-4xl leading-[1.05] font-bold tracking-tight text-secondary-950 sm:text-6xl">
              Find what&apos;s on
              <br />
              {/* Where Explore looks; changing it here changes every section. */}
              <ExplorePlacePicker className="bg-linear-to-r from-secondary via-primary-400 to-primary bg-clip-text text-transparent no-underline hover:no-underline [&_svg]:text-primary" />
            </h1>
            <p className="max-w-md text-secondary-950/60">
              Concerts, conferences, sports, food, comedy, art and more. Pick a
              day, find your thing, grab a ticket.
            </p>
          </div>

          <form
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              lastSent.current = search.trim();
              setFilters({ q: search.trim() || undefined });
            }}
            className="group flex w-full max-w-[560px] items-center gap-3 rounded-full bg-white py-2 pr-2 pl-5 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)] ring-1 ring-black/5 transition-all duration-300 focus-within:ring-secondary/40"
          >
            <Search
              className="size-5 shrink-0 text-secondary-950/45"
              aria-hidden
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={placeholder}
              aria-label={placeholder}
              className="h-10 min-w-0 flex-1 bg-transparent text-base text-secondary-950 outline-none placeholder:text-secondary-950/40"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-secondary-950/50 transition-colors hover:bg-secondary-950/5 hover:text-secondary-950"
              >
                <X className="size-4" />
              </button>
            )}
            <button
              type="submit"
              className="h-10 shrink-0 rounded-full bg-secondary px-5 text-sm font-semibold text-white transition-colors hover:bg-secondary-600"
            >
              Search
            </button>
          </form>
        </div>

        {/* Drawn in code, not from event photos, so it looks right whatever is on. */}
        <div className="mx-auto w-full max-w-[380px] lg:mx-0 lg:ml-auto">
          <PassDeck />
        </div>
      </SectionContainer>
    </section>
  );
};

export default memo(ExploreBannerComponent);
