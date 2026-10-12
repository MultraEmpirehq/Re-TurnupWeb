"use client";

import { LogoWhiteSVG } from "@/assets/svg";
import { cn } from "@/lib/utils";
import Image from "next/image";
import React, { memo, useRef, useState } from "react";
import usePointerTilt from "./use-pointer-tilt";

const CODE = Array.from({ length: 49 }, (_, index) =>
  (index * 5 + Math.floor(index / 7) * 3) % 4 < 2 ? 1 : 0,
);

/**
 * A two-sided ticket that leans toward the pointer and flips over when tapped or
 * hovered. Every few seconds it peeks at its back, to hint that it turns.
 */
const FlipTicket = () => {
  const areaRef = useRef<HTMLButtonElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  usePointerTilt(areaRef, tiltRef, { maxX: 14, maxY: 18 });

  return (
    <button
      ref={areaRef}
      type="button"
      onClick={() => setIsFlipped((current) => !current)}
      aria-pressed={isFlipped}
      aria-label={isFlipped ? "Turn the ticket back over" : "Turn the ticket over"}
      className="group relative h-[150px] w-[300px] cursor-pointer rounded-[1.4rem] [perspective:1000px] focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-primary sm:h-[170px] sm:w-[340px]"
    >
      <div
        ref={tiltRef}
        className="size-full [transform-style:preserve-3d] [transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))]"
      >
        <div
          className={cn(
            "relative size-full [transform-style:preserve-3d]",
            !isFlipped && "animate-landing-flip-hint group-hover:[animation:none]",
          )}
        >
          <div
            className={cn(
              "relative size-full transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] [transform-style:preserve-3d]",
              isFlipped && "[transform:rotateY(180deg)]",
            )}
          >
            {/* Front */}
            <div className="absolute inset-0 flex overflow-hidden rounded-[1.4rem] bg-linear-to-br from-secondary via-secondary-500 to-primary text-left text-white shadow-[0_30px_60px_-24px_rgba(5,119,250,0.6)] [backface-visibility:hidden]">
              <div className="flex flex-1 flex-col justify-between p-5">
                <Image src={LogoWhiteSVG} alt="" className="h-6 w-auto self-start" />
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.22em] text-white/75 uppercase">
                    Admit one
                  </p>
                  <p className="text-lg font-bold">Your next turn-up</p>
                </div>
              </div>
              <div className="relative flex w-[78px] flex-col items-center justify-center border-l-2 border-dashed border-white/40">
                <span className="absolute -top-3 -left-3 size-6 rounded-full bg-[var(--ticket-notch,white)]" />
                <span className="absolute -bottom-3 -left-3 size-6 rounded-full bg-[var(--ticket-notch,white)]" />
                <span className="rotate-90 text-[11px] font-semibold tracking-[0.3em] whitespace-nowrap text-white/80 uppercase">
                  No. 0001
                </span>
              </div>
            </div>

            {/* Back */}
            <div className="absolute inset-0 flex items-center gap-5 overflow-hidden rounded-[1.4rem] bg-secondary-950 p-5 text-left text-white shadow-[0_30px_60px_-24px_rgba(2,6,23,0.6)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <div className="grid shrink-0 grid-cols-7 gap-[3px] rounded-xl bg-white p-2.5">
                {CODE.map((on, index) => (
                  <span
                    key={index}
                    className={cn("size-2.5 rounded-[2px]", on ? "bg-secondary-950" : "bg-transparent")}
                  />
                ))}
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-[0.22em] text-emerald-300 uppercase">
                  Ready to scan
                </p>
                <p className="mt-1 text-lg font-bold">See you there.</p>
                <p className="mt-1 text-xs text-white/55">
                  Tap to turn it back over
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

export default memo(FlipTicket);
