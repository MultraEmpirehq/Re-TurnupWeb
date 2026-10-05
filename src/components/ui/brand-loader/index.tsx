import { cn } from "@/lib/utils";
import React, { memo, useId } from "react";
import { LOGO_PATHS, LOGO_VIEWBOX } from "./logo-paths";

type TBrandLoaderProps = {
  /** Fill the screen on the brand's night sky, for page-level waits. */
  fullScreen?: boolean;
  /** What's loading, shown under the logo. Defaults to the brand's own pun. */
  label?: string;
  className?: string;
};

/**
 * The Turnupz loader, on a loop: the wordmark writes itself out (its outline is
 * traced, then the brand gradient inks in from left to right), gives one
 * heartbeat, then fades and writes itself again.
 */
const BrandLoader: React.FC<TBrandLoaderProps> = ({
  fullScreen = false,
  label,
  className,
}) => {
  const id = useId().replace(/:/g, "");
  const gradient = `loader-ink-${id}`;
  const clip = `loader-clip-${id}`;
  const text = label ?? "Turning up...";

  const loader = (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center gap-3", className)}
    >
      <div className="animate-loader-fade relative">
        {/* A soft halo that flares with each beat. */}
        <div
          aria-hidden
          className="animate-loader-glow absolute -inset-6 rounded-full bg-linear-to-r from-secondary/40 to-primary/45 opacity-0 blur-2xl"
        />
        <svg
          viewBox={LOGO_VIEWBOX}
          aria-hidden
          className="animate-loader-beat relative h-14 w-auto overflow-visible sm:h-16"
          style={{ transformOrigin: "center" }}
        >
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-secondary)" />
              <stop offset="100%" stopColor="var(--color-primary)" />
            </linearGradient>
            <clipPath id={clip}>
              <rect
                x="0"
                y="0"
                width="137"
                height="43"
                className="animate-loader-ink"
                style={{ transformBox: "fill-box", transformOrigin: "left" }}
              />
            </clipPath>
          </defs>

          {/* The pen: each outline traced once. */}
          {LOGO_PATHS.map((d, index) => (
            <path
              key={`line-${index}`}
              d={d}
              pathLength={1}
              fill="none"
              stroke={`url(#${gradient})`}
              strokeWidth="0.6"
              strokeDasharray="1"
              strokeLinejoin="round"
              className="animate-loader-write"
            />
          ))}
          {/* The ink, revealed left to right behind the pen. */}
          <g clipPath={`url(#${clip})`}>
            {LOGO_PATHS.map((d, index) => (
              <path key={`ink-${index}`} d={d} fill={`url(#${gradient})`} />
            ))}
          </g>
        </svg>
      </div>

      {/* The words, with their dots taking turns to light up. */}
      <p
        className={cn(
          "text-sm font-medium",
          fullScreen ? "text-white/70" : "text-secondary-950/60",
        )}
      >
        {text.replace(/(\.{3}|…)$/, "")}
        <span aria-hidden>
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="animate-loader-dots"
              style={{ animationDelay: `${dot * 0.2}s` }}
            >
              .
            </span>
          ))}
        </span>
      </p>
    </div>
  );

  if (!fullScreen) return loader;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-secondary-950">
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 size-[36rem] -translate-1/2 rounded-full bg-linear-to-br from-secondary/15 to-primary/15 blur-[120px]"
      />
      {loader}
    </div>
  );
};

export default memo(BrandLoader);
