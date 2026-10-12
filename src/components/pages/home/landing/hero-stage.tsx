"use client";

import {
  LOGO_PATHS,
  LOGO_VIEWBOX,
} from "@/components/ui/brand-loader/logo-paths";
import { cn } from "@/lib/utils";
import {
  LucideIcon,
  Mic2,
  Music2,
  Palette,
  Presentation,
  Trophy,
  UtensilsCrossed,
} from "lucide-react";
import React, { memo, useMemo } from "react";

/**
 * The hero's scene, drawn entirely in code (no event photos): a Turnupz pass
 * in the middle, the kinds of events orbiting it, a stage floor and lights.
 *
 * It's driven by css variables set on an ancestor without re-rendering:
 *   --rx / --ry  the lean toward the pointer (degrees)
 *   --p          scroll progress through the hero, 0 to 1
 * As --p grows the camera pushes in, the pass turns over to its scan side and
 * the orbit opens out. Everything sits in one preserve-3d space, so leaning
 * shows real parallax between the layers.
 */

const CHIPS: { icon: LucideIcon; label: string; tone: string }[] = [
  { icon: Music2, label: "Concerts", tone: "from-primary-300 to-primary" },
  { icon: Trophy, label: "Match days", tone: "from-secondary-200 to-secondary-500" },
  { icon: UtensilsCrossed, label: "Food", tone: "from-primary-200 to-secondary-500" },
  { icon: Mic2, label: "Comedy", tone: "from-primary-200 to-primary-500" },
  { icon: Palette, label: "Art", tone: "from-zinc-300 to-zinc-600" },
  { icon: Presentation, label: "Conferences", tone: "from-secondary-200 to-secondary" },
];

// Fixed positions so the server and the browser draw the same scene.
const CONFETTI = [
  { x: -210, y: -170, z: 140, w: 26, h: 16, tone: "from-primary-300 to-primary", delay: "0s" },
  { x: 220, y: -150, z: -60, w: 34, h: 34, ring: true, tone: "border-secondary-300", delay: "-3s" },
  { x: 230, y: 170, z: 170, w: 18, h: 11, tone: "from-secondary-200 to-secondary", delay: "-6s" },
  { x: -230, y: 190, z: -180, w: 40, h: 40, ring: true, tone: "border-primary-300/70", delay: "-9s" },
  { x: 60, y: -240, z: -220, w: 14, h: 14, dot: true, tone: "from-secondary-200 to-secondary-400", delay: "-2s" },
  { x: -70, y: 250, z: 110, w: 12, h: 12, dot: true, tone: "from-white to-secondary-200", delay: "-5s" },
  { x: 150, y: 40, z: 260, w: 16, h: 10, tone: "from-primary-200 to-secondary-500", delay: "-7s" },
  { x: -160, y: -20, z: 230, w: 12, h: 12, dot: true, tone: "from-primary-200 to-primary-500", delay: "-4s" },
];

/** A QR-looking pattern, the same every time (it's decoration, not a code). */
const useQrPath = (size = 25) =>
  useMemo(() => {
    let seed = 7;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    const finder = (x: number, y: number) =>
      x < 7 && y < 7 ? true : false;
    const inFinder = (x: number, y: number) =>
      finder(x, y) || finder(size - 1 - x, y) || finder(x, size - 1 - y);
    const finderCell = (x: number, y: number) => {
      const fx = x < 7 ? x : size - 1 - x;
      const fy = y < 7 ? y : size - 1 - y;
      const ring = Math.max(Math.abs(fx - 3), Math.abs(fy - 3));
      return ring !== 2;
    };
    let d = "";
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const on = inFinder(x, y) ? finderCell(x, y) : random() > 0.52;
        if (on) d += `M${x} ${y}h1v1h-1z`;
      }
    }
    return d;
  }, [size]);

const Pass = () => {
  const qr = useQrPath();
  return (
    <div
      className="relative h-[380px] w-[240px] [transform-style:preserve-3d] [transform:rotateY(calc(clamp(0,(var(--p,0)-0.2)*2.2,1)*180deg))_rotateZ(calc(-6deg+clamp(0,(var(--p,0)-0.2)*2.2,1)*6deg))] sm:h-[420px] sm:w-[264px]"
      style={{ transition: "transform 80ms linear" }}
    >
      {/* Front: the ticket. */}
      <div className="absolute inset-0 overflow-hidden rounded-[28px] bg-linear-to-br from-secondary-400 via-secondary-600 to-primary shadow-[0_40px_90px_-30px_rgba(5,119,250,0.65)] [backface-visibility:hidden]">
        {/* Light catches the surface as it leans. */}
        <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,0.35)_48%,transparent_62%)] [transform:translateX(calc(var(--mx,0)*45%))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.25),transparent_45%)]" />
        <div className="relative flex h-full flex-col p-6 text-white">
          <div className="flex items-center justify-between">
            {/* The wordmark in white: the usual one is the brand gradient. */}
            <svg viewBox={LOGO_VIEWBOX} className="h-7 w-auto" aria-hidden>
              {LOGO_PATHS.map((d) => (
                <path key={d.slice(0, 16)} d={d} fill="white" />
              ))}
            </svg>
            <span className="rounded-full border border-white/40 px-2.5 py-0.5 text-[10px] font-bold tracking-[0.2em] uppercase">
              Admit one
            </span>
          </div>
          <div className="mt-auto space-y-1">
            <p className="text-[11px] font-semibold tracking-[0.3em] text-white/70 uppercase">
              Tonight
            </p>
            <p className="text-3xl leading-tight font-bold">
              Wherever
              <br />
              you turn up
            </p>
          </div>
          {/* Perforation, with notches cut out of either edge. */}
          <div className="relative my-5">
            <div className="border-t-2 border-dashed border-white/40" />
            <span className="absolute -top-3 -left-9 size-6 rounded-full bg-secondary-950" />
            <span className="absolute -top-3 -right-9 size-6 rounded-full bg-secondary-950" />
          </div>
          <div className="flex items-end justify-between gap-3 text-[10px] tracking-[0.18em] uppercase">
            <div className="space-y-1">
              <p className="text-white/60">Gate</p>
              <p className="text-sm font-bold">A</p>
            </div>
            <div className="space-y-1">
              <p className="text-white/60">Row</p>
              <p className="text-sm font-bold">∞</p>
            </div>
            <div className="space-y-1">
              <p className="text-white/60">Entry</p>
              <p className="text-sm font-bold">One scan</p>
            </div>
          </div>
          {/* A barcode, from fixed widths. */}
          <div className="mt-4 flex h-8 items-stretch gap-[2px] opacity-90">
            {[3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 3, 1, 2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 3, 2, 1].map(
              (width, index) => (
                <span
                  key={index}
                  className="bg-white"
                  style={{ width, opacity: index % 4 === 3 ? 0.5 : 1 }}
                />
              ),
            )}
          </div>
        </div>
      </div>

      {/* Back: what the door staff scan. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 rounded-[28px] bg-white p-8 text-secondary-950 shadow-[0_40px_90px_-30px_rgba(15,23,42,0.6)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
        <p className="text-[11px] font-bold tracking-[0.3em] text-secondary-400 uppercase">
          Scan to enter
        </p>
        <div className="relative rounded-2xl bg-secondary-50 p-4">
          <svg viewBox="0 0 25 25" className="size-40 text-secondary-950" aria-hidden>
            <path d={qr} fill="currentColor" />
          </svg>
          <span className="animate-landing-scan absolute inset-x-3 h-1 rounded-full bg-primary/70 shadow-[0_0_16px_rgba(5,119,250,0.9)]" />
        </div>
        <p className="text-center text-sm font-semibold">
          Your ticket is on your phone.
          <br />
          <span className="font-normal text-secondary-500">No queues, no paper.</span>
        </p>
      </div>
    </div>
  );
};

const RADIUS = 250;

const HeroStage: React.FC<{ className?: string }> = ({ className }) => (
  <div aria-hidden className={cn("pointer-events-none relative [perspective:1200px]", className)}>
    {/* The camera: leans to the pointer, pushes in with scroll. */}
    <div className="absolute inset-0 [transform-style:preserve-3d] [transform:translateZ(calc(var(--p,0)*220px))_rotateX(calc(var(--rx,0deg)+var(--p,0)*-8deg))_rotateY(var(--ry,0deg))] transition-transform duration-200 ease-out">
      {/* Stage floor: a grid running away into the dark. */}
      <div className="absolute top-[58%] left-1/2 h-[900px] w-[1300px] -translate-x-1/2 [transform-origin:50%_0] [transform:rotateX(80deg)_translateZ(-120px)]">
        <div className="motion-safe:animate-landing-floor size-full bg-[linear-gradient(to_right,rgba(255,255,255,0.09)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.09)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_50%_0%,black_10%,transparent_70%)]" />
      </div>

      {/* Two stage lights sweeping across. */}
      <div className="absolute -top-24 left-[8%] h-[640px] w-40 origin-top bg-linear-to-b from-secondary-300/35 via-secondary-300/10 to-transparent blur-md motion-safe:animate-landing-beam [clip-path:polygon(40%_0,60%_0,100%_100%,0_100%)]" />
      <div className="absolute -top-24 right-[8%] h-[640px] w-40 origin-top bg-linear-to-b from-primary-300/35 via-primary-300/10 to-transparent blur-md motion-safe:animate-landing-beam-reverse [clip-path:polygon(40%_0,60%_0,100%_100%,0_100%)]" />

      {/* The pass, floating at the centre. */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d]">
        <div className="motion-safe:animate-landing-float [transform-style:preserve-3d]">
          <Pass />
        </div>
      </div>

      {/* Every kind of event, orbiting it. The orbit opens out as you scroll. */}
      <div className="absolute top-1/2 left-1/2 [transform-style:preserve-3d] [transform:rotateX(-12deg)]">
        <div className="motion-safe:animate-landing-orbit [transform-style:preserve-3d]">
          {CHIPS.map((chip, index) => {
            const angle = (360 / CHIPS.length) * index;
            const Icon = chip.icon;
            return (
              <div
                key={chip.label}
                className="absolute [transform-style:preserve-3d]"
                style={{
                  transform: `rotateY(${angle}deg) translateZ(calc(${RADIUS}px + var(--p,0) * 260px)) translateY(${index % 2 ? 40 : -60}px)`,
                }}
              >
                {/* Undo the orbit's turn so each chip keeps facing you. */}
                <div style={{ transform: `rotateY(${-angle}deg)` }} className="[transform-style:preserve-3d]">
                  <div className="motion-safe:animate-landing-orbit-counter [transform-style:preserve-3d]">
                    <div className="-mt-8 -ml-8 flex size-16 flex-col items-center justify-center gap-0.5 rounded-2xl border border-white/20 bg-white/10 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.8)] backdrop-blur-sm">
                      <span className={cn("rounded-xl bg-linear-to-br p-2 text-white", chip.tone)}>
                        <Icon className="size-5" />
                      </span>
                      <span className="text-[9px] font-semibold tracking-wide text-white/80">
                        {chip.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confetti at its own depths, drifting apart as you scroll. */}
      {CONFETTI.map((piece, index) => (
        <div
          key={index}
          className="absolute top-1/2 left-1/2 [transform-style:preserve-3d]"
          style={{
            transform: `translate3d(calc(${piece.x}px * (1 + var(--p,0) * 0.8)), calc(${piece.y}px * (1 + var(--p,0) * 0.8)), ${piece.z}px)`,
          }}
        >
          <div
            className={cn(
              "motion-safe:animate-landing-spin3d",
              piece.ring && cn("rounded-full border-[5px]", piece.tone),
              piece.dot && cn("rounded-full bg-linear-to-br", piece.tone),
              !piece.ring &&
                !piece.dot &&
                cn("rounded-[5px] bg-linear-to-br shadow-[0_6px_18px_-6px_rgba(5,119,250,0.6)]", piece.tone),
            )}
            style={{ width: piece.w, height: piece.h, animationDelay: piece.delay }}
          />
        </div>
      ))}
    </div>
  </div>
);

export default memo(HeroStage);
