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
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "./popover";

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

let placesLibPromise: Promise<google.maps.PlacesLibrary> | null = null;
let geocodingLibPromise: Promise<google.maps.GeocodingLibrary> | null = null;

const ensureOptionsConfigured = () => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY. Add it to .env.local and enable the Places API.",
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
): Promise<google.maps.GeocoderAddressComponent[] | null> => {
  try {
    const { Geocoder } = await loadGeocodingLibrary();
    const geocoder = new Geocoder();
    const { results } = await geocoder.geocode({ location: { lat, lng } });
    if (!results || results.length === 0) return null;
    const withPostal = results.find((r) =>
      r.address_components?.some((c) => c.types.includes("postal_code")),
    );
    return (withPostal ?? results[0]).address_components ?? null;
  } catch {
    return null;
  }
};

const getComponent = (
  components: google.maps.GeocoderAddressComponent[] | undefined,
  type: string,
  useShort = false,
) => {
  const found = components?.find((c) => c.types.includes(type));
  if (!found) return "";
  return useShort ? found.short_name : found.long_name;
};

const buildStreetAddress = (
  components: google.maps.GeocoderAddressComponent[] | undefined,
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
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [open, setOpen] = useState(false);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const autocompleteServiceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const attributionsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingApi(true);
    loadPlacesLibrary()
      .then((places) => {
        if (cancelled) return;
        autocompleteServiceRef.current = new places.AutocompleteService();
        if (attributionsRef.current) {
          placesServiceRef.current = new places.PlacesService(
            attributionsRef.current,
          );
        }
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

  const fetchPredictions = useDebouncedCallback((q: string) => {
    const service = autocompleteServiceRef.current;
    if (!service || !q.trim()) {
      setPredictions([]);
      setIsFetching(false);
      return;
    }
    service.getPlacePredictions(
      {
        input: q,
        sessionToken: sessionTokenRef.current ?? undefined,
        ...(countryRestriction
          ? { componentRestrictions: { country: countryRestriction } }
          : {}),
      },
      (results) => {
        setPredictions(results ?? []);
        setIsFetching(false);
        setHighlightedIndex(-1);
      },
    );
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
    (prediction: google.maps.places.AutocompletePrediction) => {
      const service = placesServiceRef.current;
      if (!service) return;
      setIsResolving(true);
      onChange(prediction.description);
      service.getDetails(
        {
          placeId: prediction.place_id,
          fields: [
            "address_components",
            "formatted_address",
            "geometry.location",
          ],
          sessionToken: sessionTokenRef.current ?? undefined,
        },
        async (place, status) => {
          setOpen(false);
          if (
            status !== google.maps.places.PlacesServiceStatus.OK ||
            !place
          ) {
            setIsResolving(false);
            return;
          }
          let components = place.address_components;
          const formatted = place.formatted_address ?? prediction.description;
          const lat = place.geometry?.location?.lat() ?? 0;
          const lng = place.geometry?.location?.lng() ?? 0;

          const hasPostal = components?.some((c) =>
            c.types.includes("postal_code"),
          );
          if (!hasPostal && lat !== 0 && lng !== 0) {
            const fallback = await reverseGeocode(lat, lng);
            if (fallback) {
              const merged = [...(components ?? [])];
              for (const c of fallback) {
                const exists = merged.some((existing) =>
                  existing.types.some((t) => c.types.includes(t)),
                );
                if (!exists) merged.push(c);
              }
              components = merged;
            }
          }

          setIsResolving(false);
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
          sessionTokenRef.current =
            new google.maps.places.AutocompleteSessionToken();
        },
      );
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
          handleSelect(predictions[highlightedIndex]);
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
              key={p.place_id}
              type="button"
              onClick={() => handleSelect(p)}
              onMouseEnter={() => setHighlightedIndex(idx)}
              className={cn(
                "w-full text-left px-3 py-2 text-sm flex items-start gap-2 hover:bg-accent transition-colors",
                highlightedIndex === idx && "bg-accent",
              )}
            >
              <MapPinIcon className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div className="flex flex-col min-w-0">
                <span className="truncate">
                  {p.structured_formatting?.main_text ?? p.description}
                </span>
                {p.structured_formatting?.secondary_text && (
                  <span className="text-xs text-muted-foreground truncate">
                    {p.structured_formatting.secondary_text}
                  </span>
                )}
              </div>
            </button>
          ))}
        </PopoverContent>
      </Popover>
      <div ref={attributionsRef} className="hidden" aria-hidden="true" />
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
