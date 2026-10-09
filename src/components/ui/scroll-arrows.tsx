"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";

/**
 * The left and right arrows over a scrolling row or table, each shown only
 * when there's more that way. Clicking one scrolls by most of a screen.
 */
const ScrollArrows: React.FC<{
  edges: { left: boolean; right: boolean };
  onScroll: (direction: -1 | 1) => void;
  /** "sm" for filter rows, "md" for tables. */
  size?: "sm" | "md";
  label?: string;
}> = ({ edges, onScroll, size = "sm", label = "more" }) => {
  const button = (side: "left" | "right") => {
    const visible = side === "left" ? edges.left : edges.right;
    const Icon = side === "left" ? ChevronLeft : ChevronRight;
    return (
      <button
        type="button"
        onClick={() => onScroll(side === "left" ? -1 : 1)}
        aria-label={`Scroll ${side} to see ${label}`}
        // Keyboard users scroll the row itself, so the arrows stay out of the tab order.
        tabIndex={-1}
        aria-hidden={!visible}
        className={cn(
          "absolute top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full bg-white text-secondary-900 shadow-[0_2px_10px_rgba(15,23,42,0.18)] ring-1 ring-black/5 transition-[opacity,transform] hover:scale-105 hover:bg-secondary-50 active:scale-95",
          size === "sm" ? "size-7" : "size-9",
          side === "left" ? "left-1" : "right-1",
          visible ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <Icon className={size === "sm" ? "size-4" : "size-5"} aria-hidden />
      </button>
    );
  };
  return (
    <>
      {button("left")}
      {button("right")}
    </>
  );
};

export default ScrollArrows;
