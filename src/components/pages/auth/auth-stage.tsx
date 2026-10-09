"use client";

import { LogoWhiteSVG } from "@/assets/svg";
import Image from "next/image";
import StoreBadges from "@/components/ui/store-badges";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/app-links";
import { ROUTES } from "@/lib/variables";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React, { memo } from "react";
import AuthStory from "./auth-story";

/** The night sky behind sign-in; the ticket's notches are cut in it. */
const STAGE = "#00121a";

// Fixed positions so the server and the browser draw the same sky.
const STARS = Array.from({ length: 36 }, (_, index) => ({
  top: `${(index * 37 + 5) % 100}%`,
  left: `${(index * 61 + 13) % 100}%`,
  size: index % 5 === 0 ? 3 : 2,
  delay: `${(index % 7) * 0.6}s`,
}));

/**
 * Every sign-in step happens on one stage: the brand's night sky, full screen,
 * with the form itself drawn as a ticket. On wide screens, real upcoming events
 * and what the account is for sit either side.
 */
const AuthStage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="relative isolate flex min-h-svh w-full flex-col overflow-hidden text-white"
    style={{ backgroundColor: STAGE }}
  >
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
      <div className="absolute -top-48 -left-40 size-[34rem] rounded-full bg-secondary/25 blur-[130px]" />
      <div className="absolute -right-32 -bottom-48 size-[36rem] rounded-full bg-primary/25 blur-[140px]" />
    </div>

    <header className="flex h-[70px] shrink-0 items-center justify-between px-5 sm:px-8">
      <Link href={ROUTES.HOME.href} aria-label="Turnupz home">
        <Image src={LogoWhiteSVG} alt="Turnupz" className="h-8 w-auto" priority />
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
      {/* The sides need a wide laptop screen. */}
      <div className="absolute inset-0 hidden xl:block">
        <AuthStory />
      </div>

      {/* The ticket: a stub on top, a tear line, then the form. */}
      <div className="relative w-full max-w-[480px] shrink-0">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-10 -z-10 rounded-full bg-linear-to-br from-secondary/35 via-primary/25 to-primary/35 blur-[70px]"
        />
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
                <p className="mt-1 text-xl font-bold">Your pass to Turnupz</p>
              </div>
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold tracking-wider backdrop-blur">
                No. 0001
              </span>
            </div>
          </div>

          {/* The tear line, with a notch punched out of each side. */}
          <div aria-hidden className="relative h-0">
            <span
              className="absolute -top-3.5 -left-3.5 size-7 rounded-full"
              style={{ backgroundColor: STAGE }}
            />
            <span
              className="absolute -top-3.5 -right-3.5 size-7 rounded-full"
              style={{ backgroundColor: STAGE }}
            />
            <span className="absolute inset-x-7 top-0 border-t-2 border-dashed border-secondary-100" />
          </div>

          <div className="px-7 pt-8 pb-7">{children}</div>
        </div>
      </div>
    </main>

    {/* Store badges only once the apps are actually listed. */}
    {(APP_STORE_URL || PLAY_STORE_URL) && (
      <footer className="flex justify-center px-5 pb-6">
        <StoreBadges tone="light" className="justify-center" />
      </footer>
    )}
  </div>
);

export default memo(AuthStage);
