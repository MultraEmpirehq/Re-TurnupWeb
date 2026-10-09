"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Globe2, MapPin } from "lucide-react";
import React, { memo, useMemo, useState } from "react";
import useExplorePlace, { placeLabel } from "./use-explore-place";

/**
 * "in Lagos ▾": where Explore's sections look. Only places with something
 * coming up are offered, busiest first, so a pick is never empty.
 */
const ExplorePlacePicker: React.FC<{
  className?: string;
  /** "inline" sits inside a heading; "chip" is a standalone pill. */
  variant?: "inline" | "chip";
}> = ({ className, variant = "inline" }) => {
  const { place, setPlace, locations } = useExplorePlace();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");

  const shown = useMemo(() => {
    const value = term.trim().toLowerCase();
    if (!value) return locations;
    return locations.filter(
      (item) =>
        item.country.toLowerCase().includes(value) ||
        item.cities.some((city) => city.name.toLowerCase().includes(value)),
    );
  }, [locations, term]);

  const choose = (next: typeof place) => {
    setPlace(next);
    setOpen(false);
    setTerm("");
  };

  const isActive = (countryCode?: string, city?: string) =>
    (place?.countryCode ?? null) === (countryCode ?? null) &&
    (place?.city ?? null) === (city ?? null);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Change place, now ${placeLabel(place)}`}
          className={cn(
            variant === "inline"
              ? "inline-flex items-center gap-1 rounded-lg text-primary decoration-2 underline-offset-4 hover:underline"
              : "inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-sm font-semibold text-secondary-900 ring-1 ring-black/5 hover:bg-secondary-50",
            className,
          )}
        >
          {variant === "chip" && (
            <MapPin className="size-4 text-primary" aria-hidden />
          )}
          {variant === "inline" && "in "}
          {placeLabel(place)}
          <ChevronDown className="size-4 shrink-0" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <div className="border-b border-secondary-100 p-3">
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search a country or city"
            aria-label="Search places"
            className="h-9 w-full rounded-lg bg-secondary-50 px-3 text-sm outline-none focus:ring-2 focus:ring-secondary/30"
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-1.5">
          <button
            type="button"
            onClick={() => choose(null)}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium hover:bg-secondary-50"
          >
            <Globe2 className="size-4 text-secondary-400" aria-hidden />
            <span className="flex-1">Everywhere</span>
            {!place && <Check className="size-4 text-primary" aria-hidden />}
          </button>
          {shown.map((item) => (
            <div key={item.countryCode} className="mt-1">
              <button
                type="button"
                onClick={() =>
                  choose({
                    countryCode: item.countryCode,
                    country: item.country,
                  })
                }
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-semibold hover:bg-secondary-50"
              >
                <MapPin className="size-4 text-secondary-400" aria-hidden />
                <span className="flex-1">{item.country}</span>
                <span className="text-xs font-normal text-secondary-400">
                  {item.count}
                </span>
                {isActive(item.countryCode) && (
                  <Check className="size-4 text-primary" aria-hidden />
                )}
              </button>
              {item.cities.map((city) => (
                <button
                  key={city.name}
                  type="button"
                  onClick={() =>
                    choose({
                      countryCode: item.countryCode,
                      country: item.country,
                      city: city.name,
                    })
                  }
                  className="flex w-full items-center gap-2 rounded-lg py-1.5 pr-2.5 pl-8 text-left text-sm text-secondary-700 hover:bg-secondary-50"
                >
                  <span className="flex-1">{city.name}</span>
                  <span className="text-xs text-secondary-400">
                    {city.count}
                  </span>
                  {isActive(item.countryCode, city.name) && (
                    <Check className="size-4 text-primary" aria-hidden />
                  )}
                </button>
              ))}
            </div>
          ))}
          {locations.length > 0 && shown.length === 0 && (
            <p className="px-2.5 py-3 text-sm text-secondary-500">
              Nothing on there yet.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default memo(ExplorePlacePicker);
