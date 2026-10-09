"use client";

import useScrollEdges from "@/hooks/use-scroll-edges";
import { cn } from "@/lib/utils";
import React, { useEffect, useRef } from "react";
import ScrollArrows from "./scroll-arrows";

/**
 * A row of filter tabs or chips that stays on one line and scrolls sideways
 * when it doesn't fit, rather than wrapping onto more lines. Arrows (and a
 * soft fade) appear on whichever side has more options. `fadeClassName`
 * matches the fade to the surface behind the row (the page by default).
 */
const ScrollRow: React.FC<{
  children: React.ReactNode;
  className?: string;
  fadeClassName?: string;
}> = ({ children, className, fadeClassName = "from-background" }) => {
  const { ref, edges, measure, scrollBy } = useScrollEdges<HTMLDivElement>();

  // Bring the chosen option into view when it changes, e.g. after following a
  // link to a filtered view; scrolling by hand or with the arrows is left alone.
  // Only the row moves; the page itself never scrolls for it.
  const lastActive = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const node = ref.current;
    const active = node?.querySelector<HTMLElement>(
      '[aria-pressed="true"],[aria-selected="true"]',
    );
    if (!node || !active || active === lastActive.current) return;
    lastActive.current = active;
    const left = active.offsetLeft;
    const right = left + active.offsetWidth;
    if (left < node.scrollLeft) node.scrollLeft = left - 40;
    else if (right > node.scrollLeft + node.clientWidth) {
      node.scrollLeft = right - node.clientWidth + 40;
    }
  });

  return (
    <div className={cn("relative min-w-0 max-w-full", className)}>
      <div
        ref={ref}
        onScroll={measure}
        className="scrollbar-none relative overflow-x-auto overscroll-x-contain [&>*]:w-max [&>*]:flex-nowrap"
      >
        {children}
      </div>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-12 bg-linear-to-r to-transparent transition-opacity",
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
      <ScrollArrows edges={edges} onScroll={scrollBy} label="more filters" />
    </div>
  );
};

export default ScrollRow;
