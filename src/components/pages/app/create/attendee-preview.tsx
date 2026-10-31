"use client";

import React, { memo, useMemo } from "react";
import type { TFormValues } from "@/app/app/create/page";
import { EventPreviewCard } from "@/components/pages/app/vendor-event-view";
import { getCurrencyForCountry } from "@/lib/currency";
import { wallTimeInZoneToInstant } from "@/lib/event-time";
import {
  IEventDayDetails,
  IEventDetailsType,
  IEventTicketOptionDetails,
  PriceDetailsType,
} from "@/lib/types";

/**
 * The event as its page will show it, built from the form: the same card the
 * organiser's event preview uses, with placeholders for anything not added
 * yet. Links and buttons in it (Book Now, the venue) do nothing here.
 */
const AttendeePreview: React.FC<{
  values: TFormValues;
  coverUrl: string;
  mediaUrls: string[];
  sponsorLogoUrls: string[];
}> = ({ values, coverUrl, mediaUrls, sponsorLogoUrls }) => {
  const event = useMemo<IEventDetailsType>(() => {
    const timezone = values.eventTimezone;
    // The form keeps the venue's wall times; the page reads instants.
    const instant = (date?: Date | string | null) =>
      date ? wallTimeInZoneToInstant(new Date(date), timezone) : null;
    const days: IEventDayDetails[] = values.isMultiDay
      ? (values.eventDays ?? []).map((day, index) => ({
          id: `day-${index}`,
          startsAt: instant(day.startsAt)!.toISOString(),
          endsAt: instant(day.endsAt)?.toISOString() ?? null,
          label: day.label,
          position: index,
          performers: day.lineup,
        }))
      : [];
    const currency = getCurrencyForCountry(
      values.eventCountryCode || values.eventCountry,
    );
    const price = (amount: number) =>
      ({
        amount,
        currency: { ...currency, name: currency.code, locale: currency.locale },
      }) as unknown as PriceDetailsType;
    const tickets: IEventTicketOptionDetails[] = (values.eventTickets ?? []).map(
      (ticket) => ({
        ...ticket,
        ticketPrice: price(Number(ticket.ticketPrice) || 0),
        dayIds: (ticket.dayIndexes ?? []).map((index) => `day-${index}`),
      }),
    );

    return {
      id: "preview",
      status: "draft",
      name: values.eventName || "Untitled event",
      date: instant(values.eventDate) ?? new Date(),
      timezone,
      image: coverUrl,
      totalTickets: tickets.reduce(
        (sum, ticket) => sum + Number(ticket.ticketQuantity || 0),
        0,
      ),
      organizerName: values.organizerName,
      customCategoryName: values.categoryName,
      description: values.description,
      venueName: values.venueName,
      venueAddress: values.venueAddress,
      eventCity: values.eventCity,
      eventState: values.eventState,
      eventCountry: values.eventCountry,
      performers: values.isMultiDay ? [] : values.lineup,
      days,
      // Shown on the venue's clock, as the form has them.
      activities: (values.eventActivities ?? []).filter(Boolean).map((activity) => ({
        name: activity.activityName,
        description: activity.activityDescription,
        date: new Date(activity.activityDate),
      })),
      medias: mediaUrls,
      sponsors: (values.sponsorNames ?? []).map((name, index) => ({
        name: name?.trim() ?? "",
        imageDetails: sponsorLogoUrls[index] ? { url: sponsorLogoUrls[index] } : null,
      })),
      saleMethod: values.saleMethod,
      ticketUrl: values.ticketUrl,
      eventTickets: tickets,
      passAssignments: values.passAssignments,
    } as IEventDetailsType;
  }, [values, coverUrl, mediaUrls, sponsorLogoUrls]);

  return (
    <div
      // A preview: nothing in it should navigate away from the form.
      onClickCapture={(clickEvent) => {
        if ((clickEvent.target as HTMLElement).closest("a")) {
          clickEvent.preventDefault();
        }
      }}
    >
      <EventPreviewCard data={event} />
    </div>
  );
};

export default memo(AttendeePreview);
