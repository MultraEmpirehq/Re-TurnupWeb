"use client";

import useCategory from "@/hooks/use-category";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Cpu,
  Drama,
  Gamepad2,
  GraduationCap,
  Heart,
  LucideIcon,
  Mic,
  Music,
  Palette,
  PartyPopper,
  Shirt,
  Sparkles,
  Trophy,
  Utensils,
  Wine,
} from "lucide-react";
import React, { memo } from "react";
import useExploreFilters from "./use-explore-filters";

// Matched against the category name, so new categories still get a fitting icon.
export const CATEGORY_ICONS: [RegExp, LucideIcon][] = [
  [/music|concert|gig|afro|jazz/i, Music],
  [/comedy|stand.?up|laugh/i, Mic],
  [/food|drink|dine|brunch/i, Utensils],
  [/night|club|rave|party/i, Wine],
  [/art|exhibit|gallery|culture/i, Palette],
  [/sport|fitness|match|run/i, Trophy],
  [/tech|startup|hack/i, Cpu],
  [/business|network|conference|summit/i, Briefcase],
  [/theat|drama|film|cinema|movie/i, Drama],
  [/game|gaming|esport/i, Gamepad2],
  [/fashion|style/i, Shirt],
  [/learn|class|workshop|education/i, GraduationCap],
  [/church|faith|wedding|love/i, Heart],
  [/festival|owambe|celebrat/i, PartyPopper],
];

export const CATEGORY_TONES = [
  "from-sky-400 to-blue-600",
  "from-primary-400 to-red-600",
  "from-secondary-300 to-secondary-500",
  "from-primary-400 to-primary-600",
  "from-emerald-300 to-primary-600",
  "from-primary-400 to-primary-600",
  "from-primary-300 to-sky-600",
];

export const categoryIconFor = (name: string) =>
  CATEGORY_ICONS.find(([pattern]) => pattern.test(name))?.[1] ?? Sparkles;

/** Categories as colourful tiles; picking one filters the board below. */
const CategoryTiles = () => {
  const { data: categories } = useCategory();
  const { categoryId, setFilters } = useExploreFilters();
  if (!categories.length) return null;

  return (
    <div
      role="group"
      aria-label="Categories"
      className="scrollbar-none -mx-horizontal flex gap-3 overflow-x-auto px-horizontal pb-2 md:mx-0 md:px-0"
    >
      {categories.map((category, index) => {
        const Icon = categoryIconFor(category.name);
        const isActive = categoryId === category.id;
        const isDimmed = !!categoryId && !isActive;
        return (
          <button
            key={category.id}
            type="button"
            aria-pressed={isActive}
            onClick={() =>
              setFilters({ category: isActive ? undefined : category.id })
            }
            className={cn(
              "group relative flex h-[104px] w-[132px] shrink-0 flex-col justify-between overflow-hidden rounded-3xl bg-linear-to-br p-4 text-left text-white transition-all duration-300",
              CATEGORY_TONES[index % CATEGORY_TONES.length],
              isActive
                ? "-translate-y-1 shadow-[0_18px_30px_-14px_rgba(2,6,23,0.55)] ring-4 ring-secondary-950/90 ring-offset-2 ring-offset-[#f7f9fc]"
                : "hover:-translate-y-1 hover:shadow-[0_18px_30px_-16px_rgba(2,6,23,0.5)]",
              isDimmed &&
                "opacity-55 saturate-50 hover:opacity-90 hover:saturate-100",
            )}
          >
            <Icon
              aria-hidden
              className="absolute -right-3 -bottom-3 size-20 text-white/20 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6"
            />
            <span className="flex size-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Icon className="size-[18px]" aria-hidden />
            </span>
            <span className="relative truncate text-sm font-semibold">
              {category.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default memo(CategoryTiles);
