"use client";

import SectionContainer from "@/components/layouts/section-container/section-container";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/variables";
import {
  ArrowRight,
  BarChart3,
  MessagesSquare,
  ScanLine,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import React, { memo, useEffect, useRef, useState } from "react";
import Reveal from "./reveal";
import usePointerTilt from "./use-pointer-tilt";

const FEATURES = [
  { icon: Ticket, label: "Ticket tiers, free or paid, public or private" },
  { icon: ScanLine, label: "Door scanning from any phone" },
  { icon: MessagesSquare, label: "A group chat for every event" },
  { icon: BarChart3, label: "Sales and check-ins as they happen" },
];

// An illustration of the organiser dashboard, not real numbers.
const SAMPLE_TARGET = 248;

/** Counts up once, when the card scrolls into view. */
const useCountUp = (target: number) => {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / 1600);
        setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [target]);

  return { ref, value };
};

const ForOrganisers = () => {
  const { ref, value } = useCountUp(SAMPLE_TARGET);
  const tiltAreaRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  usePointerTilt(tiltAreaRef, tiltRef, { maxX: 10, maxY: 14 });
  const percent = Math.round((value / 300) * 100);

  return (
    <section className="bg-white pb-20 md:pb-28">
      <SectionContainer>
        <Reveal className="relative isolate overflow-hidden rounded-[2.5rem] bg-secondary-950 px-6 py-14 sm:px-12 md:py-20">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-32 right-0 size-[28rem] rounded-full bg-primary/30 blur-[110px]" />
            <div className="absolute -bottom-40 -left-20 size-[26rem] rounded-full bg-secondary/25 blur-[110px]" />
          </div>

          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="space-y-7">
              <p className="text-sm font-semibold tracking-wider text-primary-300 uppercase">
                For organisers
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
                Throw it. We&apos;ll handle the door.
              </h2>
              <ul className="space-y-3">
                {FEATURES.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-3 text-white/75">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                size="lg"
                className="group h-12 rounded-full bg-linear-to-r from-secondary to-primary px-6 text-white hover:opacity-95"
              >
                <Link href={ROUTES.SIGNUP.href}>
                  Start hosting
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>

            {/* The card's layers sit at different depths, so leaning it lifts the
                headline number off the glass. */}
            <div ref={tiltAreaRef} className="[perspective:1000px]">
            <div
              ref={(node) => {
                ref.current = node;
                tiltRef.current = node;
              }}
              aria-hidden
              className="mx-auto w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)] [transform-style:preserve-3d] [transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white/70">
                  Checked in tonight
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-300" />
                  Live
                </span>
              </div>
              <p className="mt-4 text-6xl font-bold tracking-tight text-white tabular-nums [transform:translateZ(50px)]">
                {value}
                <span className="text-2xl font-medium text-white/40"> / 300</span>
              </p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10 [transform:translateZ(30px)]">
                <div
                  className="h-full rounded-full bg-linear-to-r from-secondary to-primary"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center [transform-style:preserve-3d] [transform:translateZ(20px)]">
                {[
                  ["Regular", "182"],
                  ["VIP", "54"],
                  ["Tables", "12"],
                ].map(([tier, count]) => (
                  <div key={tier} className="rounded-2xl bg-white/[0.06] py-3">
                    <p className="text-lg font-semibold text-white tabular-nums">{count}</p>
                    <p className="text-[11px] text-white/50">{tier}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-center text-[11px] text-white/35">
                Sample dashboard
              </p>
            </div>
            </div>
          </div>
        </Reveal>
      </SectionContainer>
    </section>
  );
};

export default memo(ForOrganisers);
