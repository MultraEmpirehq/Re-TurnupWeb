"use client";

import useScrollEdges from "@/hooks/use-scroll-edges";
import { cn } from "@/lib/utils";
import React from "react";
import ScrollArrows from "./scroll-arrows";

/**
 * Where every table sits: wide tables keep their columns and scroll sideways
 * instead of squeezing into stacks of wrapped words. Arrows and a soft fade
 * mark the side with more columns; it can be swiped, or scrolled from the
 * keyboard once focused.
 *
 * `fadeClassName` sets the fade's colour to the surface behind the table
 * (white by default).
 */
const ScrollTable: React.FC<{
  children: React.ReactNode;
  className?: string;
  label?: string;
  fadeClassName?: string;
}> = ({
  children,
  className,
  label = "Table",
  fadeClassName = "from-white",
}) => {
  const { ref, edges, measure, scrollBy } = useScrollEdges<HTMLDivElement>();

  return (
    <div className={cn("relative", className)}>
      <div
        ref={ref}
        role="region"
        aria-label={label}
        // Focusable only when it scrolls, so keyboard users can use the arrow keys.
        tabIndex={edges.left || edges.right ? 0 : -1}
        onScroll={measure}
        className="overflow-x-auto overscroll-x-contain rounded-[inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap"
      >
        {children}
      </div>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-10 bg-linear-to-r to-transparent transition-opacity",
          fadeClassName,
          edges.left ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 w-12 bg-linear-to-l to-transparent transition-opacity",
          fadeClassName,
          edges.right ? "opacity-100" : "opacity-0",
        )}
      />
      <ScrollArrows
        edges={edges}
        onScroll={scrollBy}
        size="md"
        label="more columns"
      />
    </div>
  );
};

export default ScrollTable;
