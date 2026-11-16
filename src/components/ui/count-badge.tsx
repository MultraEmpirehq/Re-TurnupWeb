import { cn } from "@/lib/utils";
import React, { memo } from "react";

/**
 * A count on a menu item (work waiting, unread): a true circle for one or two
 * digits, a pill for "99+", with room around the number. Fixed height and a
 * minimum width keep it round whatever the font does.
 */
const CountBadge: React.FC<{ value: number; label?: string; className?: string }> = ({ value, label, className }) => (
  <span
    className={cn(
      "inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] leading-none font-semibold text-white tabular-nums",
      className,
    )}
    aria-label={label ?? `${value} waiting`}
  >
    {value > 99 ? "99+" : value}
  </span>
);

export default memo(CountBadge);
