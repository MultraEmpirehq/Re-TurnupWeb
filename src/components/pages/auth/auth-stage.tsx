"use client";

import { LogoWhiteSVG } from "@/assets/svg";
import StoreBadges from "@/components/ui/store-badges";
import { ROUTES } from "@/lib/variables";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { memo, useRef } from "react";
import usePointerTilt from "../home/landing/use-pointer-tilt";
import AuthStory from "./auth-story";

// Fixed positions so the server and the browser draw the same sky.
const STARS = Array.from({ length: 36 }, (_, index) => ({
  top: `${(index * 37 + 5) % 100}%`,
  left: `${(index * 61 + 13) % 100}%`,
  size: index % 5 === 0 ? 3 : 2,
  delay: `${(index % 7) * 0.6}s`,
}));

/**
 * Every sign-in step happens on one stage: a night out, full screen, with the form
 * itself drawn as a ticket. The scene behind it shifts with the pointer, nearer
 * layers more, so it has depth.
 */
const AuthStage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const stageRef = useRef<HTMLDivElement>(null);
  usePointerTilt(stageRef, stageRef, { maxX: 4, maxY: 6 });

  const drift = (depth: number) => ({
    translate: `calc(var(--mx, 0) * ${depth}px) calc(var(--my, 0) * ${depth}px)`,
  });

  return (
    <div
      ref={stageRef}
      className="relative isolate flex min-h-svh w-full flex-col overflow-hidden bg-secondary-950 text-white"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -inset-6" style={drift(-10)}>
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
        <div className="absolute -top-48 -left-40 size-[34rem] rounded-full bg-secondary/25 blur-[130px]" />
        <div className="absolute -right-32 -bottom-48 size-[36rem] rounded-full bg-primary/25 blur-[140px]" />
      </div>
      <header className="flex h-[70px] shrink-0 items-center justify-between px-5 sm:px-8">
        <Link href={ROUTES.HOME.href} aria-label="Turnupz home">
          <Image
            src={LogoWhiteSVG}
            alt="Turnupz"
            className="h-8 w-auto"
            priority
          />
        </Link>
        <Link
          href={ROUTES.HOME.href}
          className="group flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
          Back to home
        </Link>
      </header>

      <main className="relative flex w-full flex-1 items-center justify-center px-4 py-8">
        {/* The journey wraps around the ticket; it needs a wide laptop screen. */}
        <div className="absolute inset-0 hidden xl:block">
          <AuthStory />
        </div>

        {/* The ticket: a stub on top, a tear line, then the form. It leans a touch
            toward the pointer, like a real one held up to the light. */}
        <div className="relative w-full max-w-[480px] shrink-0">
          {/* A brand glow behind the ticket, so it's the brightest thing on the page. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-10 -z-10 rounded-full bg-linear-to-br from-secondary/35 via-primary/25 to-primary/35 blur-[70px]"
          />
          <div className="w-full transition-transform duration-200 ease-out [transform:perspective(1400px)_rotateX(calc(var(--rx,0deg)*-0.6))_rotateY(calc(var(--ry,0deg)*-0.6))]">
            <div className="overflow-hidden rounded-[2rem] bg-white text-secondary-950 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.85)]">
              <div className="relative overflow-hidden bg-linear-to-br from-secondary via-secondary-500 to-primary px-7 pt-6 pb-7 text-white">
                <div
                  aria-hidden
                  className="absolute -top-10 -right-10 size-40 rounded-full bg-white/15 blur-2xl"
                />
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.25em] text-white/75 uppercase">
                      Admit one
                    </p>
                    <p className="mt-1 text-xl font-bold">
                      Your pass to Turnupz
                    </p>
                  </div>
                  <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold tracking-wider backdrop-blur">
                    No. 0001
                  </span>
                </div>
              </div>

              {/* The tear line, with a notch punched out of each side. */}
              <div aria-hidden className="relative h-0">
                <span className="absolute -top-3.5 -left-3.5 size-7 rounded-full bg-secondary-950" />
                <span className="absolute -top-3.5 -right-3.5 size-7 rounded-full bg-secondary-950" />
                <span className="absolute inset-x-7 top-0 border-t-2 border-dashed border-secondary-100" />
              </div>

              <div className="px-7 pt-8 pb-7">{children}</div>
            </div>
          </div>
        </div>
      </main>

      <footer className="flex justify-center px-5 pb-6">
        <StoreBadges tone="light" className="justify-center" />
      </footer>
    </div>
  );
};

export default memo(AuthStage);
