"use client";

import { useParams } from "next/navigation";
import React, { memo, useCallback } from "react";
import { toast } from "sonner";
import { useEvent } from "@/hooks/use-event";
import SectionContainer from "@/components/layouts/section-container/section-container";
import ErrorContainer from "@/components/ui/error-container";
import { constructErrorMessage } from "@/api/functions";
import {
  EventDetailSkeleton,
  EventDetailHero,
  EventDetailTitleRow,
  EventDetailDateTime,
  EventDetailLocation,
  EventDetailGuests,
  EventDetailDescription,
  EventDetailActivities,
  EventDetailMedia,
} from "@/components/pages/explore/event-detail";
import { resolveAttachmentUrl, resolveAttachmentUrls } from "@/lib/functions";
import { eventZoneNote, instantToWallTimeInZone } from "@/lib/event-time";
import ReportEventButton from "@/components/pages/explore/event-detail/report-event-button";

const EventDetails = () => {
  const params = useParams();
  const id = params?.id?.toString() || "";
  const { data, error, refetch } = useEvent(id);
  const [copied, setCopied] = React.useState(false);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const handleShare = useCallback(async () => {
    const title = data?.name || "Event";
    const text = data?.name ? `Check out ${data.name} on Turnup` : undefined;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          url: shareUrl,
          title,
          text,
        });
        setCopied(true);
        toast.success("Shared successfully");
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        toast.error("Failed to share");
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }, [shareUrl, data?.name]);

  if (!data && !error) return <EventDetailSkeleton />;

  if (error)
    return (
      <SectionContainer className="space-y-14 py-14 min-h-[500px] h-screen flex items-center justify-center">
        <ErrorContainer
          error={constructErrorMessage(
            error as TApiErrorResponseType,
            "Unknown error occurred whilst getting event details",
          )}
          retryFunction={refetch}
        />
      </SectionContainer>
    );

  // Shown on the venue's clock, whatever zone the viewer is in.
  const eventDate = data?.date
    ? instantToWallTimeInZone(data.date, data.timezone)
    : null;
  const zoneNote = data?.date ? eventZoneNote(data.timezone, data.date) : null;
  const activities = (data?.activities ?? []).map((activity) => ({
    ...activity,
    date: activity.date
      ? instantToWallTimeInZone(activity.date, data?.timezone)
      : activity.date,
  }));
  // Prefers the attachment list, which also says what each file is, and falls back
  // to the plain urls for an event saved before attachments.
  const coverImageUrl = resolveAttachmentUrl(data?.imageDetails, data?.image);
  const eventMedias = resolveAttachmentUrls(data?.mediaDetails, data?.medias);
  const mediaList = eventMedias.length
    ? eventMedias
    : coverImageUrl
      ? [coverImageUrl]
      : [];

  const hasDescription =
    data?.description ||
    (data?.additionalInformation && data.additionalInformation.length > 0);

  return (
    <SectionContainer className="space-y-14 py-20">
      <EventDetailHero
        image={coverImageUrl}
        name={data?.name}
        venueName={data?.venue?.name}
        date={eventDate}
      />

      <EventDetailTitleRow
        eventId={id}
        name={data?.name}
        onShare={handleShare}
        copied={copied}
      />

      {eventDate && (
        <EventDetailDateTime date={eventDate} zoneNote={zoneNote} />
      )}

      {data?.venue && <EventDetailLocation venue={data.venue} />}

      {data?.eventGuestsOfHonour && data.eventGuestsOfHonour.length > 0 && (
        <EventDetailGuests guests={data.eventGuestsOfHonour} />
      )}

      {hasDescription && (
        <EventDetailDescription
          description={data?.description}
          additionalInformation={data?.additionalInformation}
        />
      )}

      {activities.length > 0 && (
        <EventDetailActivities activities={activities} />
      )}

      {mediaList.length > 0 && (
        <EventDetailMedia mediaList={mediaList} eventName={data?.name} />
      )}

      <div className="border-t pt-6">
        <ReportEventButton
          eventId={id}
          eventName={data?.name}
          isOwner={data?.isOwner}
        />
      </div>
    </SectionContainer>
  );
};

export default memo(EventDetails);
