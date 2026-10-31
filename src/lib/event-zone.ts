import { Country } from "country-state-city";
import tzLookup from "tz-lookup";

/**
 * Where an event is decides its timezone, so organisers don't have to know it.
 * Most precise first: the venue's map position, then the city's, then the
 * province's main zone, then the country's when it only has one.
 */

/** Each Canadian province's main zone (a few have pockets on another). */
const CANADA_PROVINCE_ZONES: Record<string, string> = {
  AB: "America/Edmonton",
  BC: "America/Vancouver",
  MB: "America/Winnipeg",
  NB: "America/Moncton",
  NL: "America/St_Johns",
  NS: "America/Halifax",
  NT: "America/Yellowknife",
  NU: "America/Iqaluit",
  ON: "America/Toronto",
  PE: "America/Halifax",
  QC: "America/Toronto",
  SK: "America/Regina",
  YT: "America/Whitehorse",
};

const isValidZone = (zone?: string | null): zone is string => {
  if (!zone) return false;
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
};

const fromCoordinates = (latitude?: number | string | null, longitude?: number | string | null) => {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return undefined;
  try {
    const zone = tzLookup(lat, lng);
    return isValidZone(zone) ? zone : undefined;
  } catch {
    return undefined;
  }
};

export type TEventPlace = {
  countryCode?: string;
  stateCode?: string;
  /** The city's or venue's map position. */
  latitude?: number | string | null;
  longitude?: number | string | null;
};

/** The event's timezone from where it is, or undefined if that isn't known well enough yet. */
export const zoneForPlace = (place: TEventPlace) => {
  const country = place.countryCode?.toUpperCase();
  if (!country) return undefined;
  const zones = Country.getCountryByCode(country)?.timezones ?? [];
  if (zones.length === 1 && isValidZone(zones[0].zoneName)) return zones[0].zoneName;
  const exact = fromCoordinates(place.latitude, place.longitude);
  if (exact) return exact;
  if (country === "CA" && place.stateCode) {
    return CANADA_PROVINCE_ZONES[place.stateCode.toUpperCase()];
  }
  return undefined;
};

/** "Toronto time (EST, GMT-5)", for showing which clock the times are on. */
export const describeZone = (zone: string, at: Date = new Date()) => {
  const city = zone.split("/").pop()?.replace(/_/g, " ") ?? zone;
  const part = (style: "short" | "shortOffset") => {
    try {
      return (
        new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: style })
          .formatToParts(at)
          .find((p) => p.type === "timeZoneName")?.value ?? ""
      );
    } catch {
      return "";
    }
  };
  const short = part("short");
  const offset = part("shortOffset");
  const names = [short !== offset && !short.startsWith("GMT") ? short : "", offset].filter(Boolean);
  return `${city} time${names.length ? ` (${names.join(", ")})` : ""}`;
};

/** The zone this device is set to. */
export const deviceZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
};

/** Whether two zones show the same time right now (e.g. Lagos and Douala). */
export const sameClockNow = (a?: string | null, b?: string | null, at: Date = new Date()) => {
  if (!isValidZone(a) || !isValidZone(b)) return false;
  const time = (zone: string) =>
    new Intl.DateTimeFormat("en-GB", { timeZone: zone, hour: "2-digit", minute: "2-digit", day: "2-digit" }).format(at);
  return time(a) === time(b);
};
