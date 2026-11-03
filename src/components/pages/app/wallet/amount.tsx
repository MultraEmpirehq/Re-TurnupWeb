"use client";

import { cn } from "@/lib/utils";
import useHideAmounts from "@/stores/hide-amounts-store";
import { Eye, EyeOff } from "lucide-react";
import React, { memo } from "react";

/** An amount, or dots while amounts are hidden. */
export const Amount = memo(({ value }: { value: string }) => {
  const hidden = useHideAmounts((state) => state.hidden);
  if (!hidden) return <>{value}</>;
  return (
    <span aria-label="Amount hidden" className="tracking-widest">
      ••••••
    </span>
  );
});
Amount.displayName = "Amount";

/** Shows or hides every amount on the page. */
export const HideAmountsButton = memo(
  ({ className, label = true }: { className?: string; label?: boolean }) => {
    const { hidden, toggle } = useHideAmounts();
    const Icon = hidden ? Eye : EyeOff;
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={hidden}
        aria-label={hidden ? "Show amounts" : "Hide amounts"}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full text-sm font-semibold transition-colors",
          className,
        )}
      >
        <Icon className="size-4" aria-hidden />
        {label && (hidden ? "Show amounts" : "Hide amounts")}
      </button>
    );
  },
);
HideAmountsButton.displayName = "HideAmountsButton";
