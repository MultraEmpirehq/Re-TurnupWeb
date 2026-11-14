import { cn } from "@/lib/utils";
import React from "react";

/**
 * Pick one of a few, as pills in a row: periods, currencies, "All / Paid only".
 * The one switcher for these across the site; scrolls sideways on a phone.
 */
const SegmentedControl = <T extends string | number | boolean>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { value: T; label: string; disabled?: boolean; title?: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Read out by screen readers: what's being chosen. */
  label: string;
  className?: string;
}) => (
  <div
    role="radiogroup"
    aria-label={label}
    className={cn(
      "scrollbar-none flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-border bg-card p-1",
      className,
    )}
  >
    {options.map((option) => (
      <button
        key={String(option.value)}
        type="button"
        role="radio"
        aria-checked={option.value === value}
        disabled={option.disabled}
        title={option.title}
        onClick={() => onChange(option.value)}
        className={cn(
          "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-40",
          option.value === value
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {option.label}
      </button>
    ))}
  </div>
);

export default SegmentedControl;
