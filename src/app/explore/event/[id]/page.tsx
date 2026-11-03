"use client";

import { useParams, useSearchParams } from "next/navigation";
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
  EventDetailDescription,
  EventDetailActivities,
  EventDetailMedia,
} from "@/components/pages/explore/event-detail";
import { resolveAttachmentUrl } from "@/lib/functions";
import { mediaItemsOf } from "@/components/pages/explore/event-detail/event-detail-media";
import { eventZoneNote, instantToWallTimeInZone } from "@/lib/event-time";
import ReportEventButton from "@/components/pages/explore/event-detail/report-event-button";
import HideEventButton from "@/components/pages/explore/event-detail/hide-event-button";
import EventDetailLineup from "@/components/pages/explore/event-detail/event-detail-lineup";
import EventDetailSchedule from "@/components/pages/explore/event-detail/event-detail-schedule";
import FollowButton from "@/components/discovery/follow-button";
import MessageOrganiserButton from "@/components/pages/explore/event-detail/message-organiser-button";
import Link from "next/link";
import { ROUTES } from "@/lib/variables";
import { eventShareUrl, rememberArrival, rememberShareRef } from "@/lib/share-ref";
import { postData } from "@/api";
import useUserStore from "@/stores/user-store";
import ExploreBackLink from "@/components/pages/explore/explore-back-link";
import { BlogPostsBoard, SponsorsBoard } from "@/components/pages/app/vendor-event-view";

const EventDetails = () => {
  const params = useParams();
  const id = params?.id?.toString() || "";
  const { data, error, refetch } = useEvent(id);
  const [copied, setCopied] = React.useState(false);

  // Arrived through someone's link: remember them for this event's checkout.
  const searchParams = useSearchParams();
  const arrivedRef = searchParams?.get("ref");
  React.useEffect(() => {
    rememberShareRef(id, arrivedRef);
  }, [id, arrivedRef]);
  // From a notification (?src=followers) or a promoter's link (?code=TUNDE10).
  const arrivedSrc = searchParams?.get("src");
  const arrivedCode = searchParams?.get("code");
  React.useEffect(() => {
    rememberArrival(id, { src: arrivedSrc, code: arrivedCode });
  }, [id, arrivedSrc, arrivedCode]);
  // Counts the visit for the organiser's results (once a day per visitor, on the server).
  React.useEffect(() => {
    if (id) void postData(`/event/${id}/view`, {}).catch(() => undefined);
  }, [id]);
  // Shared on, it carries their own username so a purchase earns them credit.
  const myUsername = useUserStore((state) => state.userDetails?.username);
  const shareUrl =
    typeof window !== "undefined" ? eventShareUrl(id, myUsername) : "";
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
      <SectionContainer className="space-y-8 py-14 min-h-[500px]">
        <ExploreBackLink />
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
  const eventMedias = mediaItemsOf(data?.mediaDetails, data?.medias);
  const mediaList = eventMedias.length
    ? eventMedias
    : coverImageUrl
      ? [{ url: coverImageUrl }]
      : [];

  const hasDescription =
    data?.description ||
    (data?.additionalInformation && data.additionalInformation.length > 0);

  return (
    <SectionContainer className="space-y-14 py-20">
      <ExploreBackLink />
      <EventDetailHero
        image={coverImageUrl}
        name={data?.name}
        venueName={data?.venue?.name}
        date={eventDate}
      />

      <EventDetailTitleRow
        eventId={id}
        name={data?.name}
        saleMethod={data?.saleMethod}
        ticketUrl={data?.ticketUrl}
        onShare={handleShare}
        copied={copied}
        byline={
          data?.organizerId ? (
            // Quiet, under the name, so Book Now stays the one thing to press.
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-1">
              <p className="text-sm text-muted-foreground">
                by{" "}
                <Link
                  href={`${ROUTES.EXPLORE.href}/planner/${data.organizerId}`}
                  className="font-semibold text-foreground hover:text-secondary hover:underline"
                >
                  {data.organizerName || "the organiser"}
                </Link>
              </p>
              <span className="flex items-center gap-1.5">
                <FollowButton
                  type="PLANNER"
                  id={data.organizerId}
                  name={data.organizerName || "this planner"}
                  className="h-7 rounded-full border border-secondary-200 bg-transparent px-3 text-xs font-semibold text-secondary-700 shadow-none hover:bg-secondary-50"
                />
                <MessageOrganiserButton
                  eventId={id}
                  isOwner={data?.isOwner}
                  className="h-7 rounded-full border-secondary-200 px-3 text-xs font-semibold text-secondary-700 shadow-none"
                />
              </span>
            </div>
          ) : undefined
        }
      />

      {(data?.days?.length ?? 0) > 1 ? (
        <EventDetailSchedule days={data!.days!} timezone={data?.timezone} />
      ) : (
        <>
          {eventDate && (
            <EventDetailDateTime date={eventDate} zoneNote={zoneNote} />
          )}

          {!!data?.performers?.length && (
            <EventDetailLineup performers={data.performers} />
          )}
        </>
      )}

      {data?.venue && <EventDetailLocation venue={data.venue} />}


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
        <EventDetailMedia items={mediaList} eventName={data?.name} />
      )}

      <SponsorsBoard
        hideWhenEmpty
        organizerName={data?.organizerName}
        eventYear={data?.eventYear}
        sponsors={data?.sponsors}
        sponsorImages={data?.sponsorImages}
      />

      {/* Updates from the organiser, read on the public blog. */}
      <BlogPostsBoard
        eventId={id}
        posts={data?.blogPosts}
        hrefFor={(postId) => `/blogs/${postId}`}
        fallbackImage={coverImageUrl || undefined}
      />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t pt-6">
        <HideEventButton eventId={id} isOwner={data?.isOwner} />
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
