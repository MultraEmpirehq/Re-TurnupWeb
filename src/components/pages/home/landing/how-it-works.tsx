"use client";

import SectionContainer from "@/components/layouts/section-container/section-container";
import { cn } from "@/lib/utils";
import { Compass, QrCode, Ticket } from "lucide-react";
import React, { memo, useRef, useState } from "react";
import Reveal from "./reveal";
import usePointerTilt from "./use-pointer-tilt";

const STEPS = [
  {
    icon: Compass,
    title: "Discover",
    body: "Browse what's on near you by vibe, date or venue, and save the ones you like.",
  },
  {
    icon: Ticket,
    title: "Book",
    body: "Pick a ticket tier, pay in seconds, and join the event's group chat to meet who's going.",
  },
  {
    icon: QrCode,
    title: "Turn up",
    body: "Your pass lives on your phone. One scan at the door and you're in.",
  },
];

// A fixed pattern, so the pass looks like a code without pretending to be one.
const QR = Array.from({ length: 121 }, (_, index) =>
  (index * 7 + Math.floor(index / 11) * 3) % 5 < 2 ? 1 : 0,
);

const Screen: React.FC<{ step: number }> = ({ step }) => (
  <div className="relative h-full overflow-hidden rounded-[2rem] bg-white">
    {/* Discover */}
    <div
      className={cn(
        "absolute inset-0 space-y-3 p-5 transition-all duration-500",
        step === 0 ? "opacity-100" : "pointer-events-none -translate-x-4 opacity-0",
      )}
    >
      <div className="h-9 rounded-full bg-secondary-50" />
      <div className="flex gap-2">
        {["Music", "Comedy", "Food"].map((label, index) => (
          <span
            key={label}
            className={cn(
              "rounded-full px-3 py-1 text-[10px] font-semibold",
              index === 0
                ? "bg-secondary-950 text-white"
                : "bg-secondary-50 text-secondary-700",
            )}
          >
            {label}
          </span>
        ))}
      </div>
      {[
        "from-secondary-300 to-secondary-600",
        "from-primary-200 to-primary-500",
        "from-amber-200 to-orange-400",
      ].map((gradient, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className={cn("size-14 shrink-0 rounded-2xl bg-linear-to-br", gradient)} />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 w-4/5 rounded-full bg-secondary-100" />
            <div className="h-2 w-1/2 rounded-full bg-secondary-50" />
          </div>
        </div>
      ))}
    </div>

    {/* Book */}
    <div
      className={cn(
        "absolute inset-0 flex flex-col gap-3 p-5 transition-all duration-500",
        step === 1 ? "opacity-100" : "pointer-events-none translate-x-4 opacity-0",
      )}
    >
      <div className="h-24 rounded-2xl bg-linear-to-br from-primary-200 to-primary-500" />
      {["Regular", "VIP", "Table for 4"].map((tier, index) => (
        <div
          key={tier}
          className={cn(
            "flex items-center justify-between rounded-2xl border px-3.5 py-2.5 text-[11px] font-semibold",
            index === 1
              ? "border-primary bg-primary-50 text-primary-700"
              : "border-secondary-100 text-secondary-800",
          )}
        >
          {tier}
          <span
            className={cn(
              "size-3.5 rounded-full border-2",
              index === 1 ? "border-primary bg-primary" : "border-secondary-200",
            )}
          />
        </div>
      ))}
      <div className="mt-auto rounded-full bg-secondary-950 py-2.5 text-center text-[11px] font-semibold text-white">
        Pay and get ticket
      </div>
    </div>

    {/* Turn up */}
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center gap-4 bg-linear-to-b from-secondary-950 to-secondary-900 p-6 transition-all duration-500",
        step === 2 ? "opacity-100" : "pointer-events-none scale-95 opacity-0",
      )}
    >
      <p className="text-[10px] font-semibold tracking-[0.2em] text-white/50 uppercase">
        Your pass
      </p>
      <div className="grid grid-cols-11 gap-[3px] rounded-2xl bg-white p-3">
        {QR.map((on, index) => (
          <span
            key={index}
            className={cn("size-2.5 rounded-[2px]", on ? "bg-secondary-950" : "bg-transparent")}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-semibold text-emerald-300">
        <span className="size-1.5 rounded-full bg-emerald-300" />
        Ready to scan
      </div>
    </div>
  </div>
);

// The phone turns to a new angle for each step, as if it's being handed over.
const PHONE_TURN = [-18, -4, 14];

const HowItWorks = () => {
  const [step, setStep] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  usePointerTilt(sectionRef, phoneRef, { maxX: 6, maxY: 10 });

  return (
    <section ref={sectionRef} className="bg-white py-20 md:py-28">
      <SectionContainer className="grid items-center gap-14 lg:grid-cols-2">
        <div className="space-y-10">
          <Reveal className="max-w-lg space-y-3">
            <p className="text-sm font-semibold tracking-wider text-primary uppercase">
              How it works
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-secondary-950 md:text-5xl">
              From &ldquo;what&apos;s on?&rdquo; to through the door.
            </h2>
          </Reveal>

          <ol className="space-y-3">
            {STEPS.map(({ icon: Icon, title, body }, index) => {
              const isActive = index === step;
              return (
                <Reveal as="li" key={title} delay={index * 90}>
                  <button
                    type="button"
                    onClick={() => setStep(index)}
                    onMouseEnter={() => setStep(index)}
                    aria-pressed={isActive}
                    className={cn(
                      "flex w-full items-start gap-4 rounded-3xl border p-5 text-left transition-all duration-300",
                      isActive
                        ? "border-secondary-100 bg-[#f7f9fc] shadow-[0_12px_32px_-20px_rgba(15,23,42,0.35)]"
                        : "border-transparent hover:bg-[#f7f9fc]/60",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300",
                        isActive
                          ? "bg-linear-to-br from-secondary to-primary text-white"
                          : "bg-secondary-50 text-secondary-800",
                      )}
                    >
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="space-y-1">
                      <span className="flex items-center gap-2 font-semibold text-secondary-950">
                        <span className="text-xs text-secondary-400 tabular-nums">
                          0{index + 1}
                        </span>
                        {title}
                      </span>
                      <span className="block text-sm leading-6 text-secondary-950/60">
                        {body}
                      </span>
                    </span>
                  </button>
                </Reveal>
              );
            })}
          </ol>
        </div>

        <Reveal delay={120} className="relative mx-auto w-full max-w-[300px]">
          <div
            aria-hidden
            className="absolute -inset-10 -z-10 rounded-full bg-linear-to-br from-secondary-100 via-white to-primary-100 blur-2xl"
          />
          <div className="[perspective:1200px]">
            <div
              ref={phoneRef}
              role="img"
              aria-label={`Phone showing the ${STEPS[step].title.toLowerCase()} step`}
              className="relative aspect-[9/18.5] transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] [transform-style:preserve-3d]"
              style={{
                transform: `rotateX(calc(8deg + var(--rx, 0deg))) rotateY(calc(${PHONE_TURN[step]}deg + var(--ry, 0deg)))`,
              }}
            >
              {/* The body: a back plate set behind the screen gives the phone thickness. */}
              <div className="absolute inset-0 rounded-[2.6rem] bg-secondary-900 [transform:translateZ(-14px)] shadow-[0_50px_90px_-30px_rgba(2,6,23,0.6)]" />
              <div className="absolute inset-0 rounded-[2.6rem] bg-linear-to-r from-secondary-800 via-secondary-950 to-secondary-800 [transform:translateZ(-7px)]" />
              <div className="absolute inset-0 rounded-[2.6rem] bg-secondary-950 p-2.5">
                <Screen step={step} />
                {/* Glass: a sheen that slides as the phone turns. */}
                <div className="pointer-events-none absolute inset-2.5 overflow-hidden rounded-[2rem]">
                  <div
                    className="absolute -inset-y-10 w-1/2 bg-linear-to-r from-transparent via-white/25 to-transparent blur-md transition-transform duration-[900ms] ease-out"
                    style={{
                      transform: `translateX(${80 - step * 70}%) rotate(18deg)`,
                    }}
                  />
                </div>
              </div>

              {/* Book: the chosen ticket lifts off the screen toward you. */}
              <div
                className={cn(
                  "pointer-events-none absolute top-[54%] left-1/2 w-[78%] rounded-2xl bg-white px-4 py-3 shadow-[0_24px_40px_-14px_rgba(236,72,153,0.55)] ring-1 ring-primary-100 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  step === 1 ? "opacity-100" : "opacity-0",
                )}
                style={{
                  transform: `translateX(-50%) translateZ(${step === 1 ? 70 : 0}px) rotateZ(${step === 1 ? -4 : 0}deg)`,
                }}
              >
                <p className="text-[10px] font-semibold tracking-[0.18em] text-primary uppercase">
                  VIP · Admit one
                </p>
                <div className="mt-2 h-2 w-3/4 rounded-full bg-secondary-100" />
                <div className="mt-1.5 h-2 w-1/2 rounded-full bg-secondary-50" />
              </div>

              {/* Turn up: the scan line hovers in front of the pass. */}
              <div
                className={cn(
                  "pointer-events-none absolute top-[30%] left-[12%] h-[34%] w-[76%] overflow-hidden rounded-2xl transition-opacity duration-500",
                  step === 2 ? "opacity-100" : "opacity-0",
                )}
                style={{ transform: "translateZ(40px)" }}
              >
                <div className="animate-landing-scan absolute inset-x-0 h-1 rounded-full bg-emerald-300 shadow-[0_0_18px_4px_rgba(110,231,183,0.7)]" />
              </div>
            </div>
          </div>
        </Reveal>
      </SectionContainer>
    </section>
  );
};

export default memo(HowItWorks);
