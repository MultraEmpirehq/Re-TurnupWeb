"use client";

import SectionContainer from "@/components/layouts/section-container/section-container";
import { Button } from "@/components/ui/button";
import { AppleIcon, GooglePlayIcon } from "@/components/ui/store-badges";
import { useEvents } from "@/hooks/use-event";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/variables";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import TicketCard, { TicketCardSkeleton } from "./ticket-card";
import usePointerTilt from "./use-pointer-tilt";

const WORDS = [
  "owambe",
  "concert",
  "comedy night",
  "rave",
  "match day",
  "art show",
  "night out",
];

// Fixed positions so the server and the browser draw the same sky.
const STARS = Array.from({ length: 28 }, (_, index) => ({
  top: `${(index * 37) % 100}%`,
  left: `${(index * 61 + 13) % 100}%`,
  size: index % 5 === 0 ? 3 : 2,
  delay: `${(index % 7) * 0.6}s`,
}));

// Where each ticket in the fan sits in 3D space, back to front (px and degrees).
const FAN = [
  { x: -74, y: 28, z: -140, turn: -10 },
  { x: 74, y: 12, z: -70, turn: 8 },
  { x: 0, y: -6, z: 40, turn: -1 },
];

const pose = ({ x, y, z, turn }: { x: number; y: number; z: number; turn: number }) =>
  `translate3d(${x}px, ${y}px, ${z}px) rotateZ(${turn}deg)`;

// Where tickets wait before sliding in from the right on first load.
const OFFSTAGE = { x: 300, y: 40, z: -260, turn: 16 };

// The detour the front ticket takes when it's tucked behind the others: out to the
// left and toward you, then round to the back, like dealing a card under the deck.
const TUCK = { x: -150, y: 30, z: 30, turn: -12 };

const CYCLE_MS = 3600;

// Confetti hanging at different depths around the tickets, so leaning the stage
// shows real parallax. Each spins slowly on its own axis.
const CONFETTI = [
  { x: -170, y: -150, z: 120, size: 26, shape: "ticket", tone: "from-primary-300 to-primary", delay: "0s" },
  { x: 165, y: -130, z: -40, size: 34, shape: "ring", tone: "border-secondary-300", delay: "-3s" },
  { x: 190, y: 120, z: 160, size: 18, shape: "ticket", tone: "from-secondary-200 to-secondary", delay: "-6s" },
  { x: -190, y: 150, z: -200, size: 40, shape: "ring", tone: "border-primary-300/70", delay: "-9s" },
  { x: 40, y: -205, z: -220, size: 14, shape: "dot", tone: "from-amber-200 to-orange-400", delay: "-2s" },
  { x: -40, y: 210, z: 90, size: 12, shape: "dot", tone: "from-white to-secondary-200", delay: "-5s" },
] as const;

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
        comedy night.
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
  const { data, isLoading } = useEvents({ limit: 3, isTrending: true });
  const events = useMemo(
    () => (data?.pages?.flatMap((page) => page?.data || []) || []).slice(0, 3),
    [data],
  );
  const showFan = isLoading || events.length > 0;
  usePointerTilt(stageRef, stageRef, { maxX: 7, maxY: 11 });
  // The ticket at the front of the fan. It changes on its own every few seconds,
  // and tapping a ticket (or its dot) brings that one forward instead.
  const [front, setFront] = useState(0);
  const [hasEntered, setHasEntered] = useState(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isPausedRef = useRef(false);
  const frontRef = useRef(front);
  frontRef.current = front;

  // Slide the tickets in once real ones have arrived.
  useEffect(() => {
    if (!events.length || hasEntered) return;
    const timer = setTimeout(() => setHasEntered(true), 150);
    return () => clearTimeout(timer);
  }, [events.length, hasEntered]);

  const bringForward = useCallback(
    (next: number) => {
      const leaving = frontRef.current;
      if (next === leaving || !events[next]) return;
      setFront(next);
      // A front ticket that's headed for the back swings out and round instead of
      // sliding straight through the others.
      const leavingSlot = (leaving - next + 2 + FAN.length) % FAN.length;
      const node = cardRefs.current[leaving];
      if (
        leavingSlot === 0 &&
        node &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        node.animate(
          [
            { transform: pose(FAN[2]) },
            { transform: pose(TUCK), offset: 0.45 },
            { transform: pose(FAN[0]) },
          ],
          { duration: 1000, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        );
      }
    },
    [events],
  );

  // The loop: every few seconds the ticket behind comes forward. It waits while
  // the pointer is over the fan, while the tab is hidden, and for reduced motion.
  useEffect(() => {
    if (events.length < 2 || !hasEntered) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      if (isPausedRef.current || document.hidden) return;
      // The middle ticket steps up, and the front one tucks in at the back.
      let next = (frontRef.current + 2) % FAN.length;
      while (!events[next]) next = (next + 2) % FAN.length;
      bringForward(next);
    }, CYCLE_MS);
    return () => clearInterval(timer);
  }, [events, hasEntered, bringForward]);

  // The spotlight follows the pointer by updating two css variables, so moving
  // the mouse never re-renders anything.
  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const node = stageRef.current;
    if (!node) return;
    const box = node.getBoundingClientRect();
    node.style.setProperty("--spot-x", `${event.clientX - box.left}px`);
    node.style.setProperty("--spot-y", `${event.clientY - box.top}px`);
  };

  const fanOrder = (position: number) => {
    // Rotate positions so the chosen ticket takes the front slot.
    return (position - front + 2 + FAN.length) % FAN.length;
  };

  return (
    <section
      ref={stageRef}
      onPointerMove={handlePointerMove}
      className="relative isolate overflow-hidden bg-secondary-950 [--spot-x:70%] [--spot-y:30%]"
    >
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

      <SectionContainer
        className={cn(
          // Extra room on top: the header floats over the hero rather than above it.
          "grid items-center gap-14 pt-32 pb-20 md:pt-40 md:pb-28 lg:gap-8",
          showFan && "lg:grid-cols-[1.1fr_0.9fr]",
        )}
      >
        <div className="flex flex-col items-start gap-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/80 backdrop-blur">
            <Sparkles className="size-3.5 text-primary-300" aria-hidden />
            Tickets, chats and entry, all in one place
          </span>

          <h1 className="text-[2.6rem] leading-[1.05] font-bold tracking-tighter text-white sm:text-6xl lg:text-7xl">
            Find your next
            <br />
            <RotatingWord />
            <span className="sr-only">
              Concerts, owambes, comedy nights and more.
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

          {/* The app is the main way in, so the hero points to it. */}
          <a
            href="#get-the-app"
            className="group -mt-1 inline-flex items-center gap-3 text-sm text-white/60 transition-colors hover:text-white"
          >
            <span className="flex items-center gap-1.5 text-white/80">
              <AppleIcon className="size-4" />
              <GooglePlayIcon className="size-4" />
            </span>
            Best on the Turnupz app for iPhone and Android
            <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </a>
        </div>

        {/* The fan of tickets, in real 3D: the stage leans toward the pointer and each
            ticket and piece of confetti sits at its own depth. Hidden on small screens,
            where the copy is the hero. */}
        {showFan && (
          <div
            onPointerEnter={() => (isPausedRef.current = true)}
            onPointerLeave={() => (isPausedRef.current = false)}
            onFocus={() => (isPausedRef.current = true)}
            onBlur={() => (isPausedRef.current = false)}
            className="relative mx-auto hidden h-[460px] w-full max-w-[420px] [perspective:1100px] sm:block"
          >
            <div className="absolute inset-0 transition-transform duration-200 ease-out [transform-style:preserve-3d] [transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))]">
              <div className="animate-landing-float absolute inset-0 [transform-style:preserve-3d]">
                {CONFETTI.map((piece, index) => (
                  <div
                    key={index}
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 left-1/2 [transform-style:preserve-3d]"
                    style={{
                      transform: `translate3d(${piece.x}px, ${piece.y}px, ${piece.z}px)`,
                    }}
                  >
                    <div
                      className={cn(
                        "animate-landing-spin3d",
                        piece.shape === "ring" &&
                          cn("rounded-full border-[5px]", piece.tone),
                        piece.shape === "ticket" &&
                          cn(
                            "rounded-[5px] bg-linear-to-br shadow-[0_6px_18px_-6px_rgba(236,72,153,0.6)]",
                            piece.tone,
                          ),
                        piece.shape === "dot" &&
                          cn("rounded-full bg-linear-to-br", piece.tone),
                      )}
                      style={{
                        width: piece.size,
                        height: piece.shape === "ticket" ? piece.size * 0.62 : piece.size,
                        animationDelay: piece.delay,
                      }}
                    />
                  </div>
                ))}

                {[0, 1, 2].map((position) => {
                  const event = events[position];
                  // Fewer than three trending events: only draw the ones there are.
                  if (!isLoading && !event) return null;
                  const slot = fanOrder(position);
                  const isFront = slot === 2;
                  const isWaiting = !isLoading && !hasEntered;
                  return (
                    <div
                      key={position}
                      ref={(node) => {
                        cardRefs.current[position] = node;
                      }}
                      onClick={(click) => {
                        if (!isFront && event) {
                          click.preventDefault();
                          bringForward(position);
                        }
                      }}
                      className={cn(
                        "absolute top-1/2 left-1/2 -mt-[150px] -ml-[140px] w-[280px] transition-[transform,opacity,filter] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                        !isFront && event && "cursor-pointer",
                        !isFront && "saturate-75",
                        isWaiting ? "opacity-0" : !isFront && "opacity-85",
                      )}
                      style={{
                        transform: pose(isWaiting ? OFFSTAGE : FAN[slot]),
                        // Staggered so they deal in one after another.
                        transitionDelay: hasEntered ? "0ms" : `${(2 - slot) * 140}ms`,
                      }}
                    >
                      {isLoading || !event ? (
                        <TicketCardSkeleton className="bg-white/95" />
                      ) : (
                        <div className={cn(!isFront && "pointer-events-none")}>
                          <TicketCard event={event} tilt={false} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {events.length > 1 && (
              <div className="absolute -bottom-3 flex w-full items-center justify-center gap-3">
                <span className="text-xs text-white/45">Trending now</span>
                <div className="flex items-center gap-1.5">
                  {events.map((event, position) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => bringForward(position)}
                      aria-label={`Show ${event.name}`}
                      aria-current={position === front}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-500",
                        position === front
                          ? "w-6 bg-white"
                          : "w-1.5 bg-white/35 hover:bg-white/60",
                      )}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </SectionContainer>
    </section>
  );
};

export default memo(LandingHero);
