import {
  instantToWallTimeInZone,
  wallTimeInZoneToInstant,
} from "@/lib/event-time";
import { IEventDetailsType } from "@/lib/types";
import { IEventDayFormValue } from "./event-days-input";

/** The days as the api takes them: instants in the event's zone, in order. */
export const eventDaysPayload = (
  days: IEventDayFormValue[],
  timezone?: string,
) =>
  days.map((day) => ({
    ...(day.id ? { id: day.id } : {}),
    startsAt: wallTimeInZoneToInstant(new Date(day.startsAt), timezone),
    endsAt: day.endsAt
      ? wallTimeInZoneToInstant(new Date(day.endsAt), timezone)
      : null,
    ...(day.label?.trim() ? { label: day.label.trim() } : {}),
    performerIds: day.lineup.map((performer) => performer.id),
  }));

/** A saved event's days back into the form, on the event's clock. */
export const eventDaysFromEvent = (event: IEventDetailsType) =>
  (event.days ?? []).map((day) => ({
    id: day.id,
    startsAt: instantToWallTimeInZone(day.startsAt, event.timezone),
    endsAt: day.endsAt
      ? instantToWallTimeInZone(day.endsAt, event.timezone)
      : null,
    label: day.label ?? "",
    lineup: day.performers ?? [],
  }));

/** A saved ticket's day ids as positions in the event's days. */
export const ticketDayIndexes = (
  dayIds: string[] | undefined,
  event: IEventDetailsType,
) =>
  (dayIds ?? [])
    .map((id) => (event.days ?? []).findIndex((day) => day.id === id))
    .filter((index) => index >= 0);

