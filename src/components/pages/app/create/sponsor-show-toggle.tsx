import { cn } from "@/lib/utils";
import React, { memo } from "react";

/** A sponsor with a logo can show either it or the name on the board. */
const SponsorShowToggle = ({
  showName,
  onChange,
  className,
}: {
  showName: boolean;
  onChange: (showName: boolean) => void;
  className?: string;
}) => (
  <div
    role="radiogroup"
    aria-label="Show on the sponsor board"
    className={cn("inline-flex rounded-full bg-secondary-50 p-0.5 text-[11px] font-semibold", className)}
  >
    {(
      [
        [false, "Logo"],
        [true, "Name"],
      ] as const
    ).map(([value, label]) => (
      <button
        key={label}
        type="button"
        role="radio"
        aria-checked={showName === value}
        onClick={() => onChange(value)}
        className={cn(
          "rounded-full px-2.5 py-0.5 transition-colors",
          showName === value ? "bg-white text-secondary-950 shadow-sm" : "text-muted-foreground",
        )}
      >
        {label}
      </button>
    ))}
  </div>
);

export default memo(SponsorShowToggle);
