import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import React from "react";

/** "▲ 12% vs previous 30 days", in good/bad colours with an arrow, never colour alone. */
const Change: React.FC<{
  value: number | null;
  hasCurrent: boolean;
  versus: string;
}> = ({ value, hasCurrent, versus }) => {
  if (!versus)
    return (
      <span className="text-xs text-secondary-400">Since your first sale</span>
    );
  if (value === null) {
    return (
      <span className="text-xs text-secondary-400">
        {hasCurrent
          ? `New: nothing in the ${versus}`
          : `Nothing yet, or in the ${versus}`}
      </span>
    );
  }
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold",
          value > 0 && "bg-emerald-50 text-emerald-700",
          value < 0 && "bg-red-50 text-red-700",
          value === 0 && "bg-secondary-50 text-secondary-600",
        )}
      >
        <Icon className="size-3.5" aria-hidden />
        {Math.abs(value)}%
      </span>
      <span className="text-secondary-400">vs {versus}</span>
    </span>
  );
};

export default Change;
