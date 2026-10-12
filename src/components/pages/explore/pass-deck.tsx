"use client";

import { cn } from "@/lib/utils";
import usePointerTilt from "@/components/pages/home/landing/use-pointer-tilt";
import { addDays, format, nextSaturday, startOfWeek } from "date-fns";
import { ArrowUpRight } from "lucide-react";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import useExploreFilters from "./use-explore-filters";
import useExplorePlace from "./use-explore-place";

type TPass = {
  when: "today" | "weekend" | "next-week";
  eyebrow: string;
  title: string;
  dates: string;
  tone: string;
  glow: string;
};

/**
 * Explore's banner art: a deck of passes for tonight, this weekend and next
 * week, drawn in code rather than from event photos, so it looks the same
 * whatever is on. Every few seconds the front pass lifts up and over to the
 * back (not a sideways swipe); the deck leans toward the pointer; tapping a
 * pass shows that time.
 */
const PassDeck = () => {
  const areaRef = useRef<HTMLDivElement>(null);
  usePointerTilt(areaRef, areaRef, { maxX: 10, maxY: 14 });
  const { when, setFilters } = useExploreFilters();
  const { inLabel } = useExplorePlace();
  const [front, setFront] = useState(0);
  const [lifting, setLifting] = useState<number | null>(null);
  const pausedRef = useRef(false);

  const passes = useMemo<TPass[]>(() => {
    const today = new Date();
    const saturday = today.getDay() === 6 ? today : nextSaturday(today);
    const nextMonday = addDays(startOfWeek(today, { weekStartsOn: 1 }), 7);
    return [
      {
        when: "today",
        eyebrow: "Tonight",
        title: `What's on ${inLabel}`,
        dates: format(today, "EEE d MMM"),
        tone: "from-secondary-400 via-secondary-600 to-primary",
        glow: "rgba(5,119,250,0.55)",
      },
      {
        when: "weekend",
        eyebrow: "This weekend",
        title: "Two days to fill",
        dates: `${format(saturday, "d")}–${format(addDays(saturday, 1), "d MMM")}`,
        tone: "from-primary-300 via-primary-500 to-secondary-700",
        glow: "rgba(5,119,250,0.5)",
      },
      {
        when: "next-week",
        eyebrow: "Next week",
        title: "Plan ahead",
        dates: `From ${format(nextMonday, "d MMM")}`,
        tone: "from-secondary-400 via-secondary-700 to-secondary-950",
        glow: "rgba(5,119,250,0.5)",
      },
    ];
  }, [inLabel]);

  // The front pass lifts away to the back every few seconds; it waits while
  // the pointer is over the deck, the tab is hidden, or motion is reduced.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      if (pausedRef.current || document.hidden) return;
      setLifting(front);
      setTimeout(() => {
        setFront((current) => (current + 1) % passes.length);
        setLifting(null);
      }, 420);
    }, 4200);
    return () => clearInterval(timer);
  }, [front, passes.length]);

  return (
    <div
      ref={areaRef}
      onPointerEnter={() => (pausedRef.current = true)}
      onPointerLeave={() => (pausedRef.current = false)}
      className="relative mx-auto h-[420px] w-full max-w-[360px] [perspective:1100px]"
    >
      <div className="absolute inset-0 [transform-style:preserve-3d] [transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))] transition-transform duration-200 ease-out">
        {/* Rings and confetti at their own depths, for parallax. */}
        <span aria-hidden className="absolute top-6 -left-4 size-12 rounded-full border-[5px] border-secondary-300/70 [transform:translateZ(80px)] motion-safe:animate-landing-spin3d" />
        <span aria-hidden className="absolute right-0 bottom-10 size-9 rounded-full border-[5px] border-primary-300/70 [transform:translateZ(-60px)] motion-safe:animate-landing-spin3d" />
        <span aria-hidden className="absolute top-16 right-6 h-3 w-5 rounded-[3px] bg-linear-to-br from-secondary-200 to-secondary-500 [transform:translateZ(120px)] motion-safe:animate-landing-spin3d" />
        <span aria-hidden className="absolute bottom-20 left-2 h-3 w-5 rounded-[3px] bg-linear-to-br from-primary-300 to-primary [transform:translateZ(60px)] motion-safe:animate-landing-spin3d" />

        {passes.map((pass, index) => {
          // 0 is the front, then each behind it.
          const depth = (index - front + passes.length) % passes.length;
          const isLifting = lifting === index;
          const isActive = when === pass.when;
          return (
            <button
              key={pass.when}
              type="button"
              tabIndex={depth === 0 ? 0 : -1}
              aria-label={`Show ${pass.eyebrow.toLowerCase()}`}
              onClick={() => {
                if (depth !== 0) {
                  setFront(index);
                  return;
                }
                setFilters({ when: isActive ? undefined : pass.when });
              }}
              className={cn(
                "absolute top-1/2 left-1/2 -mt-[170px] -ml-[130px] h-[340px] w-[260px] rounded-[26px] bg-linear-to-br text-left text-white transition-[transform,opacity,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] [transform-style:preserve-3d]",
                pass.tone,
                depth !== 0 && "saturate-75",
              )}
              style={{
                zIndex: 10 - depth,
                boxShadow: `0 40px 80px -30px ${pass.glow}`,
                transform: isLifting
                  ? // Up and over the deck, tipping back as it goes.
                    "translate3d(0, -180px, 120px) rotateX(38deg) rotateZ(-4deg)"
                  : `translate3d(${depth * 18}px, ${depth * -22}px, ${depth * -70}px) rotateZ(${-4 + depth * 5}deg)`,
                opacity: isLifting ? 0 : depth === 2 ? 0.75 : 1,
              }}
            >
              <span className="absolute inset-0 overflow-hidden rounded-[26px]">
                <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,0.32)_48%,transparent_62%)] [transform:translateX(calc(var(--mx,0)*45%))]" />
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_85%_8%,rgba(255,255,255,0.3),transparent_45%)]" />
              </span>
              <span className="relative flex h-full flex-col p-6">
                <span className="flex items-center justify-between text-[10px] font-bold tracking-[0.24em] uppercase">
                  <span className="rounded-full border border-white/40 px-2.5 py-0.5">
                    {pass.eyebrow}
                  </span>
                  <span className="text-white/75">{pass.dates}</span>
                </span>
                <span className="mt-auto block text-[1.7rem] leading-tight font-bold">
                  {pass.title}
                </span>
                <span className="relative my-5 block">
                  <span className="block border-t-2 border-dashed border-white/40" />
                  <span className="absolute -top-3 -left-9 size-6 rounded-full bg-[#f7fbff]" />
                  <span className="absolute -top-3 -right-9 size-6 rounded-full bg-[#f7fbff]" />
                </span>
                <span className="flex items-center justify-between text-sm font-semibold">
                  {isActive ? "Showing now" : "See what's on"}
                  <span className="flex size-9 items-center justify-center rounded-full bg-white/20">
                    <ArrowUpRight className="size-4" />
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default memo(PassDeck);
