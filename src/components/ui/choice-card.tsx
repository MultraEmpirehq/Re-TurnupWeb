import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import React from "react";

/**
 * One option in a pick-one group, shown as a card: an icon, a title and a line
 * on what it means. Put several inside an element with role="radiogroup".
 */
const ChoiceCard = ({
  selected,
  onSelect,
  icon: Icon,
  title,
  description,
  disabled,
}: {
  selected: boolean;
  onSelect: () => void;
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    disabled={disabled}
    onClick={onSelect}
    className={cn(
      "flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
      selected
        ? "border-primary bg-info-soft ring-1 ring-primary"
        : "border-border bg-card hover:bg-muted",
    )}
  >
    {Icon && <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />}
    <span className="min-w-0 space-y-0.5">
      <span className="block text-sm font-semibold text-foreground">{title}</span>
      {description && (
        <span className="block text-sm text-muted-foreground">{description}</span>
      )}
    </span>
  </button>
);

export default ChoiceCard;
