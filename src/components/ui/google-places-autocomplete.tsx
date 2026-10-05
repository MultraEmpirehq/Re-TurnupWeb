"use client";

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { useDebouncedCallback } from "use-debounce";
import { AlertTriangle, MapPinIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "./input";
import { Label } from "./label";
import { Spinner } from "./spinner";
import { env } from "@/lib/env";
import { Popover, PopoverAnchor, PopoverContent } from "./popover";

const DEBOUNCE_MS = 300;

export interface IPlaceResolved {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

interface IGooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (place: IPlaceResolved) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
  countryRestriction?: string | string[];
}

// One shape for address parts from both Places (New), which uses longText and
// shortText, and the Geocoder, which uses long_name and short_name.
type TAddressPart = { long: string; short: string; types: string[] };

const fromPlaces = (
  parts: google.maps.places.AddressComponent[] | null | undefined,
): TAddressPart[] =>
  (parts ?? []).map((part) => ({
    long: part.longText ?? "",
    short: part.shortText ?? "",
    types: part.types,
  }));

const fromGeocoder = (
  parts: google.maps.GeocoderAddressComponent[] | undefined,
): TAddressPart[] =>
  (parts ?? []).map((part) => ({
    long: part.long_name,
    short: part.short_name,
    types: part.types,
  }));

let placesLibPromise: Promise<google.maps.PlacesLibrary> | null = null;
let geocodingLibPromise: Promise<google.maps.GeocodingLibrary> | null = null;

const ensureOptionsConfigured = () => {
  const apiKey = env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY. Add it to .env and enable Places API (New).",
    );
  }
  setOptions({ key: apiKey, v: "weekly" });
};

const loadPlacesLibrary = () => {
  if (placesLibPromise) return placesLibPromise;
  try {
    ensureOptionsConfigured();
  } catch (err) {
    return Promise.reject(err);
  }
  placesLibPromise = importLibrary("places");
  return placesLibPromise;
};

const loadGeocodingLibrary = () => {
  if (geocodingLibPromise) return geocodingLibPromise;
  try {
    ensureOptionsConfigured();
  } catch (err) {
    return Promise.reject(err);
  }
  geocodingLibPromise = importLibrary("geocoding");
  return geocodingLibPromise;
};

const reverseGeocode = async (
  lat: number,
  lng: number,
): Promise<TAddressPart[] | null> => {
  try {
    const { Geocoder } = await loadGeocodingLibrary();
    const geocoder = new Geocoder();
    const { results } = await geocoder.geocode({ location: { lat, lng } });
    if (!results || results.length === 0) return null;
    const withPostal = results.find((r) =>
      r.address_components?.some((c) => c.types.includes("postal_code")),
    );
    return fromGeocoder((withPostal ?? results[0]).address_components);
  } catch {
    return null;
  }
};

const getComponent = (
  components: TAddressPart[] | undefined,
  type: string,
  useShort = false,
) => {
  const found = components?.find((c) => c.types.includes(type));
  if (!found) return "";
  return useShort ? found.short : found.long;
};

const buildStreetAddress = (
  components: TAddressPart[] | undefined,
  fallback: string,
) => {
  const streetNumber = getComponent(components, "street_number");
  const route = getComponent(components, "route");
  const street = [streetNumber, route].filter(Boolean).join(" ").trim();
  return street || fallback;
};

const GooglePlacesAutocomplete: React.FC<IGooglePlacesAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelected,
  label,
  placeholder = "Search for a location...",
  required,
  error,
  className,
  inputClassName,
  labelClassName,
  errorClassName,
  countryRestriction,
}) => {
  const [predictions, setPredictions] = useState<
    google.maps.places.PlacePrediction[]
  >([]);
  const [open, setOpen] = useState(false);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const placesRef = useRef<google.maps.PlacesLibrary | null>(null);
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  // Drops answers to a search the person has already typed past.
  const latestQueryRef = useRef("");

  useEffect(() => {
    let cancelled = false;
    setIsLoadingApi(true);
    loadPlacesLibrary()
      .then((places) => {
        if (cancelled) return;
        placesRef.current = places;
        sessionTokenRef.current = new places.AutocompleteSessionToken();
        setLoadError(null);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setLoadError(err?.message || "Failed to load Google Maps");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingApi(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchPredictions = useDebouncedCallback(async (q: string) => {
    const places = placesRef.current;
    latestQueryRef.current = q;
    if (!places || !q.trim()) {
      setPredictions([]);
      setIsFetching(false);
      return;
    }
    try {
      const { suggestions } =
        await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: q,
          sessionToken: sessionTokenRef.current ?? undefined,
          ...(countryRestriction
            ? {
                includedRegionCodes: (Array.isArray(countryRestriction)
                  ? countryRestriction
                  : [countryRestriction]
                ).map((code) => code.toLowerCase()),
              }
            : {}),
        });
      if (latestQueryRef.current !== q) return;
      setPredictions(
        suggestions
          .map((suggestion) => suggestion.placePrediction)
          .filter(
            (prediction): prediction is google.maps.places.PlacePrediction =>
              !!prediction,
          ),
      );
      setHighlightedIndex(-1);
    } catch {
      if (latestQueryRef.current === q) setPredictions([]);
    } finally {
      if (latestQueryRef.current === q) setIsFetching(false);
    }
  }, DEBOUNCE_MS);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      onChange(next);
      setOpen(true);
      if (next.trim()) {
        setIsFetching(true);
        fetchPredictions(next);
      } else {
        setPredictions([]);
        setIsFetching(false);
      }
    },
    [onChange, fetchPredictions],
  );

  const handleSelect = useCallback(
    async (prediction: google.maps.places.PlacePrediction) => {
      const places = placesRef.current;
      if (!places) return;
      const label = prediction.text?.text ?? "";
      setIsResolving(true);
      onChange(label);
      setOpen(false);
      try {
        const place = prediction.toPlace();
        await place.fetchFields({
          fields: ["addressComponents", "formattedAddress", "location"],
        });

        let components = fromPlaces(place.addressComponents);
        const formatted = place.formattedAddress ?? label;
        const lat = place.location?.lat() ?? 0;
        const lng = place.location?.lng() ?? 0;

        // Places often leaves the postcode out; the Geocoder usually has it.
        const hasPostal = components.some((c) =>
          c.types.includes("postal_code"),
        );
        if (!hasPostal && lat !== 0 && lng !== 0) {
          const fallback = await reverseGeocode(lat, lng);
          if (fallback) {
            const merged = [...components];
            for (const c of fallback) {
              const exists = merged.some((existing) =>
                existing.types.some((t) => c.types.includes(t)),
              );
              if (!exists) merged.push(c);
            }
            components = merged;
          }
        }

        onPlaceSelected({
          address: buildStreetAddress(components, formatted),
          city:
            getComponent(components, "locality") ||
            getComponent(components, "postal_town") ||
            getComponent(components, "sublocality") ||
            getComponent(components, "administrative_area_level_2"),
          state: getComponent(components, "administrative_area_level_1"),
          country: getComponent(components, "country"),
          postalCode: getComponent(components, "postal_code"),
          latitude: lat,
          longitude: lng,
          formattedAddress: formatted,
        });
      } catch {
        // The typed text stays, so the person can still carry on by hand.
      } finally {
        setIsResolving(false);
        // A session ends with the details lookup; the next search starts a new one.
        sessionTokenRef.current = new places.AutocompleteSessionToken();
      }
    },
    [onChange, onPlaceSelected],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open || predictions.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((i) => (i + 1) % predictions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex(
          (i) => (i - 1 + predictions.length) % predictions.length,
        );
      } else if (e.key === "Enter") {
        if (highlightedIndex >= 0) {
          e.preventDefault();
          void handleSelect(predictions[highlightedIndex]);
        }
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    },
    [open, predictions, highlightedIndex, handleSelect],
  );

  const showSpinner = useMemo(
    () => isLoadingApi || isFetching || isResolving,
    [isLoadingApi, isFetching, isResolving],
  );

  return (
    <div className={cn("space-y-2 relative", className)}>
      {label && (
        <div className="flex items-center gap-2">
          <Label className={cn("opacity-70", labelClassName)}>{label}</Label>
          {required && <span className="text-destructive">*</span>}
          {showSpinner && <Spinner className="size-4 animate-spin" />}
        </div>
      )}
      <Popover open={open && !loadError} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative w-full">
            <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              value={value}
              onChange={handleInputChange}
              onFocus={() => {
                if (predictions.length > 0) setOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              autoComplete="off"
              disabled={isLoadingApi || !!loadError}
              className={cn("pl-9 py-5", inputClassName)}
              aria-invalid={!!error}
            />
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="p-0 w-[var(--radix-popover-trigger-width)] max-h-72 overflow-y-auto"
        >
          {predictions.length === 0 && !isFetching && (
            <p className="px-3 py-3 text-sm text-muted-foreground text-center">
              No results
            </p>
          )}
          {isFetching && predictions.length === 0 && (
            <div className="flex items-center justify-center py-3">
              <Spinner className="size-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {predictions.map((p, idx) => (
            <button
              key={p.placeId}
              type="button"
              onClick={() => void handleSelect(p)}
              onMouseEnter={() => setHighlightedIndex(idx)}
              className={cn(
                "w-full text-left px-3 py-2 text-sm flex items-start gap-2 hover:bg-accent transition-colors",
                highlightedIndex === idx && "bg-accent",
              )}
            >
              <MapPinIcon className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div className="flex flex-col min-w-0">
                <span className="truncate">
                  {p.mainText?.text ?? p.text?.text}
                </span>
                {p.secondaryText?.text && (
                  <span className="text-xs text-muted-foreground truncate">
                    {p.secondaryText.text}
                  </span>
                )}
              </div>
            </button>
          ))}
        </PopoverContent>
      </Popover>
      {loadError && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertTriangle className="size-3" />
          {loadError}
        </p>
      )}
      {error && !loadError && (
        <p className={cn("text-xs text-destructive", errorClassName)}>
          {error}
        </p>
      )}
    </div>
  );
};

export default memo(GooglePlacesAutocomplete);
