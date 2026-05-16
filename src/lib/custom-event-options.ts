import { ICategoryDetailsType, IVenueDetailsType } from "@/lib/types";

const CUSTOM_CATEGORIES_KEY = "turnup-custom-categories";
const CUSTOM_VENUES_KEY = "turnup-custom-venues";
const CUSTOM_OPTIONS_UPDATED = "turnup:custom-options-updated";

const canUseStorage = () => typeof window !== "undefined";

const readList = <T,>(key: string): T[] => {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeList = <T,>(key: string, items: T[]) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CUSTOM_OPTIONS_UPDATED));
};

export const getCustomCategories = () =>
  readList<ICategoryDetailsType>(CUSTOM_CATEGORIES_KEY);

export const saveCustomCategory = (name: string) => {
  const trimmedName = name.trim();
  if (!trimmedName || !canUseStorage()) return null;

  const current = getCustomCategories();
  const existing = current.find(
    (category) => category.name.toLowerCase() === trimmedName.toLowerCase(),
  );
  if (existing) return existing;

  const nextCategory: ICategoryDetailsType = {
    id: `custom-category-${trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: trimmedName,
  };

  writeList(CUSTOM_CATEGORIES_KEY, [nextCategory, ...current]);
  return nextCategory;
};

export const getCustomVenues = () => readList<IVenueDetailsType>(CUSTOM_VENUES_KEY);

export const saveCustomVenue = (name: string) => {
  const trimmedName = name.trim();
  if (!trimmedName || !canUseStorage()) return null;

  const current = getCustomVenues();
  const existing = current.find(
    (venue) => venue.name.toLowerCase() === trimmedName.toLowerCase(),
  );
  if (existing) return existing;

  const nextVenue: IVenueDetailsType = {
    id: `custom-venue-${trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: trimmedName,
    address: "Custom venue",
    rating: 0,
    totalAvailableSeat: 0,
    images: [],
  };

  writeList(CUSTOM_VENUES_KEY, [nextVenue, ...current]);
  return nextVenue;
};

export const subscribeToCustomOptions = (callback: () => void) => {
  if (!canUseStorage()) return () => {};
  window.addEventListener(CUSTOM_OPTIONS_UPDATED, callback);
  return () => window.removeEventListener(CUSTOM_OPTIONS_UPDATED, callback);
};
