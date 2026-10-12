"use client";

import SectionContainer from "@/components/layouts/section-container/section-container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/variables";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import React, { memo, useEffect, useRef, useState } from "react";
import HeroStage from "./hero-stage";
import usePointerTilt from "./use-pointer-tilt";
import useScrollProgress from "./use-scroll-progress";

// Every kind of event, so the line never reads as just a night out.
const WORDS = [
  "concert",
  "conference",
  "match day",
  "food festival",
  "comedy show",
  "workshop",
  "art show",
  "family day",
];

// Fixed positions so the server and the browser draw the same sky.
const STARS = Array.from({ length: 28 }, (_, index) => ({
  top: `${(index * 37) % 100}%`,
  left: `${(index * 61 + 13) % 100}%`,
  size: index % 5 === 0 ? 3 : 2,
  delay: `${(index % 7) * 0.6}s`,
}));

const RotatingWord = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(
      () => setIndex((current) => (current + 1) % WORDS.length),
      2400,
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="relative inline-grid align-bottom">
      {/* The widest word holds the space so the line never jumps. */}
      <span className="invisible col-start-1 row-start-1" aria-hidden>
        food festival.
      </span>
      {WORDS.map((word, wordIndex) => (
        <span
          key={word}
          aria-hidden={wordIndex !== index}
          className={cn(
            "col-start-1 row-start-1 bg-linear-to-r from-secondary-300 via-primary-300 to-primary bg-clip-text text-transparent transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
            wordIndex === index
              ? "translate-y-0 opacity-100 blur-0"
              : "translate-y-3 opacity-0 blur-sm",
          )}
        >
          {word}.
        </span>
      ))}
    </span>
  );
};

const LandingHero = () => {
  const stageRef = useRef<HTMLElement>(null);
  // The scene leans toward the pointer and moves with scroll, through css
  // variables, so neither re-renders anything.
  usePointerTilt(stageRef, stageRef, { maxX: 8, maxY: 12 });
  useScrollProgress(stageRef, stageRef);

  // The spotlight follows the pointer the same way.
  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const node = stageRef.current;
    if (!node) return;
    const box = node.getBoundingClientRect();
    node.style.setProperty("--spot-x", `${event.clientX - box.left}px`);
    node.style.setProperty("--spot-y", `${event.clientY - box.top}px`);
  };

  return (
    // Twice the screen tall, with the scene pinned while it plays: the extra
    // height is the scroll that brings it to life. Reduced motion: one screen.
    <section
      ref={stageRef}
      onPointerMove={handlePointerMove}
      className="relative bg-secondary-950 [--spot-x:70%] [--spot-y:30%] motion-safe:h-[200svh]"
    >
      <div className="sticky top-0 isolate flex h-svh min-h-[600px] items-center overflow-hidden">
      {/* Sky: stars, two slow brand glows and the pointer spotlight. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -inset-6 translate-x-[calc(var(--mx,0)*-14px)] translate-y-[calc(var(--my,0)*-10px)]">
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
        </div>
        <div className="absolute -top-40 -left-32 size-[34rem] rounded-full bg-secondary/25 blur-[120px]" />
        <div className="absolute -right-24 -bottom-48 size-[36rem] rounded-full bg-primary/25 blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(520px_circle_at_var(--spot-x)_var(--spot-y),rgba(255,255,255,0.09),transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
      </div>

      <SectionContainer className="grid w-full items-center gap-6 pt-28 pb-16 lg:grid-cols-[1fr_1fr] lg:gap-4 lg:pt-24 lg:pb-12">
        {/* The words lift and fade as the stage takes over on scroll. */}
        <div className="relative z-10 flex flex-col items-start gap-7 [opacity:calc(1-var(--p,0)*1.6)] [transform:translateY(calc(var(--p,0)*-90px))]">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/80 backdrop-blur">
            <Sparkles className="size-3.5 text-primary-300" aria-hidden />
            Tickets, chats and entry, all in one place
          </span>

          <h1 className="text-[2.6rem] leading-[1.05] font-bold tracking-tighter text-white sm:text-6xl lg:text-7xl">
            Find your next
            <br />
            <RotatingWord />
            <span className="sr-only">
              Concerts, conferences, sports, food, comedy, workshops and more.
            </span>
          </h1>

          <p className="max-w-md text-base leading-7 text-white/65 md:text-lg">
            The Turnupz app shows you what&apos;s happening around you, books
            your seat in a few taps, and gets you through the door with one
            scan.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="group h-12 rounded-full bg-white px-6 text-secondary-950 hover:bg-white/90"
            >
              <Link href={ROUTES.EXPLORE.href}>
                Explore events
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="h-12 rounded-full border border-white/20 px-6 text-white hover:bg-white/10 hover:text-white"
            >
              <Link href={ROUTES.SIGNUP.href}>Host an event</Link>
            </Button>
          </div>
        </div>

        {/* The closing line, taking the words' place once the pass has turned. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[22%] z-10 hidden px-[inherit] lg:block [opacity:clamp(0,calc((var(--p,0)-0.55)*3),1)] [transform:translateY(calc((1-clamp(0,calc((var(--p,0)-0.55)*3),1))*40px))]"
        >
          <div className="mx-auto max-w-[1200px] px-horizontal">
            <p className="max-w-md text-5xl leading-[1.05] font-bold tracking-tighter text-white">
              One scan.
              <br />
              <span className="bg-linear-to-r from-secondary-300 via-primary-300 to-primary bg-clip-text text-transparent">
                You&apos;re in.
              </span>
            </p>
            <p className="mt-5 max-w-sm text-base leading-7 text-white/60">
              Your ticket lives on your phone, so the door is the easy part.
            </p>
          </div>
        </div>

        {/* The scene: smaller under the words on phones, beside them on wide screens. */}
        <HeroStage className="mx-auto h-[360px] w-full max-w-[560px] [zoom:0.72] sm:h-[480px] sm:[zoom:0.9] lg:h-[620px] lg:[zoom:1]" />
      </SectionContainer>

      {/* A nudge to scroll, fading out once you do. */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[11px] tracking-[0.3em] text-white/45 uppercase [opacity:calc(1-var(--p,0)*4)] md:flex"
      >
        Scroll
        <span className="flex h-9 w-5 justify-center rounded-full border border-white/30 pt-1.5">
          <span className="h-2 w-0.5 rounded-full bg-white/60 motion-safe:animate-bounce" />
        </span>
      </div>
      </div>
    </section>
  );
};

export default memo(LandingHero);
