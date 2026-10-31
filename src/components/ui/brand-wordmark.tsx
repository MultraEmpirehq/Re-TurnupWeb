import { cn } from "@/lib/utils";
import React, { memo, useId } from "react";
import { LOGO_PATHS, LOGO_VIEWBOX, LOGO_WIDTH } from "./brand-loader/logo-paths";

/**
 * The Turnupz wordmark inked in the brand gradient, for light backgrounds (the
 * logo file is white-only). Same paths as the brand loader.
 */
const BrandWordmark: React.FC<{ className?: string }> = ({ className }) => {
  const gradient = `wordmark-ink-${useId().replace(/:/g, "")}`;
  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      role="img"
      aria-label="Turnupz"
      className={cn("h-8 w-auto", className)}
    >
      <defs>
        <linearGradient
          id={gradient}
          x1="0"
          y1="0"
          x2={LOGO_WIDTH}
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--color-secondary)" />
          <stop offset="100%" stopColor="var(--color-primary)" />
        </linearGradient>
      </defs>
      {LOGO_PATHS.map((d) => (
        <path key={d.slice(0, 16)} d={d} fill={`url(#${gradient})`} />
      ))}
    </svg>
  );
};

export default memo(BrandWordmark);
