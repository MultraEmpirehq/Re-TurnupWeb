"use client";

import InputField from "@/components/ui/input-field";
import { useVenues } from "@/hooks/use-venue";
import { MapPin } from "lucide-react";
import React, { memo, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";

type TPicked = { id: string; name: string; address?: string | null };

/**
 * The venue, typed in. As they type, matching venues from the directory are
 * offered; picking one links the event to it (map, details). Anything else is
 * kept as typed, with an optional address, and goes to the team to add to the
 * directory. The event goes live either way.
 */
const VenueField: React.FC<{
  venueId: string;
  venueName: string;
  venueAddress: string;
  onPick: (venue: TPicked) => void;
  onTypeName: (name: string) => void;
  onTypeAddress: (address: string) => void;
  country?: string;
  state?: string;
  error?: string;
}> = ({
  venueId,
  venueName,
  venueAddress,
  onPick,
  onTypeName,
  onTypeAddress,
  country,
  state,
  error,
}) => {
  const [focused, setFocused] = useState(false);
  const [query] = useDebounce(venueName.trim(), 300);
  const isLinked = !!venueId && !venueId.startsWith("custom-venue-");
  const { data } = useVenues(
    {
      ...(query ? { q: query } : {}),
      ...(country?.trim() ? { country: country.trim() } : {}),
      ...(state?.trim() ? { state: state.trim() } : {}),
    },
    query.length >= 2 && !isLinked,
  );
  const suggestions = useMemo(
    () =>
      (data?.pages?.flatMap((page) => page?.data ?? []) ?? [])
        .filter((venue) => !venue.id.startsWith("custom-venue-"))
        .slice(0, 6),
    [data],
  );
  const showSuggestions =
    focused && !isLinked && query.length >= 2 && suggestions.length > 0;

  return (
    <div className="space-y-3">
      <div className="relative">
        <InputField
          label="Venue"
          required
          placeholder="Type the venue's name"
          value={venueName}
          autoComplete="off"
          onChange={(event) => onTypeName(event.target.value)}
          onFocus={() => setFocused(true)}
          // Let a click on a suggestion land before the list closes.
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          error={error}
          helperText={
            isLinked
              ? "Linked to our venue directory."
              : "Pick a match below, or just type it in."
          }
        />
        {showSuggestions && (
          <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-secondary-100 bg-white shadow-lg">
            <li className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-secondary-400 uppercase">
              From the venue directory
            </li>
            {suggestions.map((venue) => (
              <li key={venue.id}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onPick({
                      id: venue.id,
                      name: venue.name,
                      address: venue.address,
                    });
                    setFocused(false);
                  }}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-secondary-50"
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary-600" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-secondary-950">
                      {venue.name}
                    </span>
                    <span className="block truncate text-xs text-secondary-500">
                      {venue.address}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isLinked ? (
        <p className="flex items-center gap-2 text-xs text-secondary-600">
          <MapPin className="size-3.5 text-primary-600" />
          {venueAddress || "Address from the directory"}
          <button
            type="button"
            onClick={() => onTypeName(venueName)}
            className="font-semibold text-primary-700 hover:underline"
          >
            Type a different venue
          </button>
        </p>
      ) : (
        venueName.trim() && (
          <InputField
            label="Venue address (optional)"
            placeholder="Street, area — helps people find it"
            value={venueAddress}
            autoComplete="off"
            onChange={(event) => onTypeAddress(event.target.value)}
            helperText="Not in our directory yet? It still shows on your event; our team adds it after a quick check."
          />
        )
      )}
    </div>
  );
};

export default memo(VenueField);
