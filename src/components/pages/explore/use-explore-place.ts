"use client";

import { useEventLocations } from "@/hooks/use-discovery";
import { IEventLocation } from "@/lib/types";
import { useCallback, useEffect, useMemo, useState } from "react";

/** A country, or one of its cities, that Explore's sections are about. */
export type TExplorePlace = {
  countryCode: string;
  country: string;
  city?: string;
};

const STORAGE_KEY = "turnupz-explore-place";
const CHANGE_EVENT = "turnupz-explore-place-change";

/** `undefined` means not chosen yet; `null` means everywhere. */
const readStored = (): TExplorePlace | null | undefined => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return undefined;
    return JSON.parse(raw) as TExplorePlace | null;
  } catch {
    return undefined;
  }
};

/** The region in the browser's language, e.g. "NG" from "en-NG". */
const browserRegion = () => {
  try {
    return new Intl.Locale(navigator.language).maximize().region?.toUpperCase();
  } catch {
    return undefined;
  }
};

export const placeLabel = (place?: TExplorePlace | null) =>
  place ? (place.city ?? place.country) : "everywhere";

/**
 * Where Explore is looking ("Trending in Lagos"), as in the app: remembered in
 * this browser, and until someone picks, their own country when it has events
 * coming up, else everywhere. Every section header changes it.
 */
const useExplorePlace = () => {
  const locationsQuery = useEventLocations();
  const locations = useMemo(
    () => locationsQuery.data ?? [],
    [locationsQuery.data],
  );
  const [stored, setStored] = useState<TExplorePlace | null | undefined>(
    undefined,
  );
  const [hasRead, setHasRead] = useState(false);

  useEffect(() => {
    const sync = () => setStored(readStored());
    sync();
    setHasRead(true);
    // Every header on the page shares one place.
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const place = useMemo<TExplorePlace | null>(() => {
    if (stored !== undefined) return stored;
    const region = browserRegion();
    const home = locations.find((item) => item.countryCode === region);
    return home
      ? { countryCode: home.countryCode, country: home.country }
      : null;
  }, [locations, stored]);

  const setPlace = useCallback((next: TExplorePlace | null) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Private windows: still changes for this visit.
    }
    setStored(next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return {
    place,
    setPlace,
    locations: locations as IEventLocation[],
    label: placeLabel(place),
    /** For sentences: "in Lagos", or "anywhere". */
    inLabel: place ? `in ${placeLabel(place)}` : "anywhere",
    /**
     * The place is settled: the saved one is read, or with none saved, the
     * places list is in to find the visitor's own country. Queries wait for it
     * so they don't load everywhere first and then reload for the place.
     */
    isReady: hasRead && (stored !== undefined || !locationsQuery.isLoading),
  };
};

export default useExplorePlace;
