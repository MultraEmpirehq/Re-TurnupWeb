/** Events are set in Lagos unless the organiser picked another zone. */
export const DEFAULT_EVENT_TIMEZONE = "Africa/Lagos";

const isValidZone = (zone?: string | null): zone is string => {
  if (!zone) return false;
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
};

const viewerZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
};

/** The zone a new event starts with: the organiser's own, else Lagos. */
export const defaultEventTimezone = () => {
  const zone = viewerZone();
  return isValidZone(zone) ? zone : DEFAULT_EVENT_TIMEZONE;
};

/**
 * An event time as the venue's clock shows it, e.g. "Sat 1 Nov 2026, 8:00 PM WAT".
 * The zone abbreviation is added when it differs from the viewer's own zone, so
 * someone abroad isn't misled about when doors open.
 */
export const formatEventTime = (
  value: Date | string | number,
  timezone?: string | null,
  options: {
    withYear?: boolean;
    withWeekday?: boolean;
    timeOnly?: boolean;
  } = {},
) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const zone = isValidZone(timezone) ? timezone : DEFAULT_EVENT_TIMEZONE;
  const showZone = zone !== viewerZone();
  const { withYear = true, withWeekday = true, timeOnly = false } = options;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    ...(timeOnly
      ? {}
      : {
          ...(withWeekday ? { weekday: "short" as const } : {}),
          day: "numeric" as const,
          month: "short" as const,
          ...(withYear ? { year: "numeric" as const } : {}),
        }),
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...(showZone ? { timeZoneName: "short" as const } : {}),
  }).format(date);
};

const wallClockParts = (instant: Date, zone: string) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(instant)
      .map((part) => [part.type, part.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month) - 1,
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
};

/** How far ahead of UTC the zone's clock is at that instant, in ms. */
const zoneOffsetMs = (instant: Date, zone: string) => {
  const p = wallClockParts(instant, zone);
  const asUtc = Date.UTC(p.year, p.month, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
};

/**
 * Pickers hand back a Date in the viewer's own zone. This reads its clock time
 * (say 8:00 PM on 1 Nov) as a time in the event's zone and returns that instant,
 * so an organiser abroad still sets the venue's 8 PM.
 */
export const wallTimeInZoneToInstant = (
  wallTime: Date,
  timezone?: string | null,
) => {
  if (!isValidZone(timezone) || timezone === viewerZone()) return wallTime;
  const asUtc = Date.UTC(
    wallTime.getFullYear(),
    wallTime.getMonth(),
    wallTime.getDate(),
    wallTime.getHours(),
    wallTime.getMinutes(),
    wallTime.getSeconds(),
  );
  // Two passes settle the offset when the time sits near a DST change.
  const first = asUtc - zoneOffsetMs(new Date(asUtc), timezone);
  return new Date(asUtc - zoneOffsetMs(new Date(first), timezone));
};

/** The reverse: a Date whose local clock shows what the event's zone shows. */
export const instantToWallTimeInZone = (
  instant: Date | string,
  timezone?: string | null,
) => {
  const date = new Date(instant);
  if (!isValidZone(timezone) || timezone === viewerZone()) return date;
  const p = wallClockParts(date, timezone);
  return new Date(p.year, p.month, p.day, p.hour, p.minute, p.second);
};

/** Every IANA zone the browser knows, for the event timezone picker. */
export const listTimezones = (): string[] => {
  const supported = (
    Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
  ).supportedValuesOf?.("timeZone");
  return supported?.length
    ? supported
    : [
        "Africa/Lagos",
        "Africa/Accra",
        "Africa/Nairobi",
        "Africa/Johannesburg",
        "Africa/Cairo",
        "Europe/London",
        "Europe/Paris",
        "America/New_York",
        "America/Chicago",
        "America/Los_Angeles",
        "America/Toronto",
        "Asia/Dubai",
      ];
};

/** "GMT+1 · Africa/Lagos" when the event's zone isn't the viewer's, else null. */
export const eventZoneNote = (
  timezone?: string | null,
  at: Date | string = new Date(),
) => {
  const zone = isValidZone(timezone) ? timezone : DEFAULT_EVENT_TIMEZONE;
  if (zone === viewerZone()) return null;
  const offset =
    new Intl.DateTimeFormat("en-GB", {
      timeZone: zone,
      timeZoneName: "shortOffset",
    })
      .formatToParts(new Date(at))
      .find((part) => part.type === "timeZoneName")?.value ?? "";
  return `${offset ? `${offset} · ` : ""}${zone.replace(/_/g, " ")}`;
};
