"use client";

import dynamic from "next/dynamic";
import React, { memo, useMemo } from "react";
import { useMarkets } from "@/hooks/use-markets";
import { Skeleton } from "./skeleton";
import type { IPlaceResolved } from "./google-places-autocomplete";

export type { IPlaceResolved };

const GooglePlacesAutocomplete = dynamic(
  () => import("./google-places-autocomplete"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-11 w-full rounded-xl" />,
  },
);

/**
 * Every address on the site: type it, or pick a Google suggestion (limited to
 * the countries Turnupz is open in). Typing still works if a place isn't found
 * or Maps is down, so no one is ever stuck. `onPlace` gets the city, state,
 * country, postal code and position when a suggestion is picked.
 */
const AddressField = ({
  value,
  onChange,
  onPlace,
  label = "Address",
  placeholder = "Start typing the address",
  required,
  error,
  helperText,
  className,
  countries,
  anyCountry,
}: {
  value: string;
  onChange: (value: string) => void;
  onPlace?: (place: IPlaceResolved) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  /** Defaults to Turnupz's markets. */
  countries?: string[];
  /** Search worldwide (where someone lives, say), not only Turnupz's markets. */
  anyCountry?: boolean;
}) => {
  const markets = useMarkets();
  const marketCodes = useMemo(() => markets.map((market) => market.code), [markets]);
  return (
    <GooglePlacesAutocomplete
      label={label}
      placeholder={placeholder}
      required={required}
      value={value}
      onChange={onChange}
      onPlaceSelected={(place) => onPlace?.(place)}
      countryRestriction={anyCountry ? undefined : (countries ?? marketCodes)}
      error={error}
      helperText={helperText}
      className={className}
    />
  );
};

export default memo(AddressField);
