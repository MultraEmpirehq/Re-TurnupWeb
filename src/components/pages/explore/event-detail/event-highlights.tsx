"use client";

import { constructErrorMessage } from "@/api/functions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { IHighlight, useEventHighlights, useReportHighlight } from "@/hooks/use-event-highlights";
import { useEvents } from "@/hooks/use-event";
import { formatEventTime } from "@/lib/event-time";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/variables";
import useUserStore from "@/stores/user-store";
import { ArrowRight, Camera, ChevronLeft, ChevronRight, Clock, Flag, Play, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { memo, useMemo, useState } from "react";
import AddCrowdPhotos from "./add-crowd-photos";

const clipLength = (seconds: number | null) =>
  seconds ? `0:${String(seconds).padStart(2, "0")}` : null;

/** A photo or a clip's first frame, filling its box. */
const Media = ({ item, className }: { item: IHighlight; className?: string }) =>
  item.type === "video" ? (
    <video src={`${item.url}#t=0.1`} className={cn("size-full object-cover", className)} muted playsInline preload="metadata" />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={item.url} alt={item.caption || (item.by ? `Photo from ${item.by}` : "Event photo")} className={cn("size-full object-cover", className)} loading="lazy" />
  );

/** Full-size view with previous and next; fans' photos can be reported. */
const Viewer = ({
  eventId,
  items,
  index,
  onIndex,
  onClose,
}: {
  eventId: string;
  items: IHighlight[];
  index: number | null;
  onIndex: (index: number) => void;
  onClose: () => void;
}) => {
  const signedIn = !!useUserStore((state) => state.userDetails);
  const report = useReportHighlight(eventId);
  const item = index === null ? null : items[index];
  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] gap-3 border-0 bg-black p-3 text-white sm:max-w-4xl">
        <DialogTitle className="sr-only">{item?.caption || "Highlight"}</DialogTitle>
        {item && (
          <>
            <div className="relative flex max-h-[75vh] items-center justify-center overflow-hidden rounded-lg">
              {item.type === "video" ? (
                <video src={item.url} controls autoPlay playsInline className="max-h-[75vh] w-full" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt={item.caption || "Event photo"} className="max-h-[75vh] w-auto object-contain" />
              )}
              {items.length > 1 && (
                <>
                  <button type="button" aria-label="Previous" onClick={() => onIndex((index! - 1 + items.length) % items.length)} className="absolute left-2 flex size-11 items-center justify-center rounded-full bg-black/60 text-white">
                    <ChevronLeft className="size-5" aria-hidden />
                  </button>
                  <button type="button" aria-label="Next" onClick={() => onIndex((index! + 1) % items.length)} className="absolute right-2 flex size-11 items-center justify-center rounded-full bg-black/60 text-white">
                    <ChevronRight className="size-5" aria-hidden />
                  </button>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-sm">
              <span className="text-white/80">
                {[item.by, item.caption].filter(Boolean).join(" · ") || "From the organiser"}
              </span>
              {!item.fromOrganiser && signedIn && (
                <button
                  type="button"
                  disabled={report.isPending}
                  onClick={() =>
                    report.mutate(item.id, {
                      onSuccess: () => toast.success("Thanks for letting us know."),
                      onError: (error) => toast.error(constructErrorMessage(error as TApiErrorResponseType, "Couldn't report it.")),
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-white/70 hover:bg-white/10 hover:text-white"
                >
                  <Flag className="size-3.5" aria-hidden /> Report
                </button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

/**
 * The top of an ended event's page: the organiser's photos and clips as a
 * grid, in place of the cover. Renders nothing until there are some.
 */
export const HighlightsGallery = memo(({ eventId }: { eventId: string }) => {
  const { data } = useEventHighlights(eventId);
  const [open, setOpen] = useState<number | null>(null);
  const items = data?.organiser ?? [];
  if (!items.length) return null;
  const shown = items.slice(0, 4);
  const more = items.length - shown.length;
  return (
    <section aria-label="Highlights" className="space-y-2">
      <div className="grid auto-rows-[140px] grid-cols-2 gap-2 sm:auto-rows-[200px] md:grid-cols-4">
        {shown.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setOpen(index)}
            aria-label={item.type === "video" ? "Play clip" : "View photo"}
            className={cn(
              "group relative overflow-hidden rounded-2xl bg-secondary-900",
              index === 0 && "col-span-2 row-span-2",
              index === 1 && shown.length > 2 && "md:col-span-2",
            )}
          >
            <Media item={item} className="transition-transform duration-500 group-hover:scale-[1.03]" />
            {index === 0 && (
              <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1 text-xs font-bold text-white">
                <Sparkles className="size-3.5" aria-hidden /> Highlights
              </span>
            )}
            {item.type === "video" && (
              <>
                <span className="absolute inset-0 m-auto flex size-14 items-center justify-center rounded-full bg-white/90 text-secondary-950">
                  <Play className="size-5 fill-current" aria-hidden />
                </span>
                {clipLength(item.durationSeconds) && (
                  <span className="absolute right-2 bottom-2 rounded-full bg-black/65 px-2 py-0.5 text-xs font-bold text-white">
                    {clipLength(item.durationSeconds)}
                  </span>
                )}
              </>
            )}
            {more > 0 && index === shown.length - 1 && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-xl font-extrabold text-white">
                +{more} more
              </span>
            )}
          </button>
        ))}
      </div>
      <Viewer eventId={eventId} items={items} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
    </section>
  );
});
HighlightsGallery.displayName = "HighlightsGallery";

/** The organiser's next event, so people who missed this one can book that. */
const NextEvent = ({ eventId, organizerId, organizerName }: { eventId: string; organizerId: string; organizerName?: string }) => {
  const now = useMemo(() => new Date().toISOString(), []);
  const { data } = useEvents({ organizerId, startDate: now, limit: 3 });
  const next = data?.pages?.[0]?.data?.find((event) => event.id !== eventId);
  if (!next) return null;
  return (
    <section aria-label="Next event" className="flex flex-wrap gap-4 rounded-2xl border border-info-line bg-info-soft p-4">
      {next.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={next.image} alt="" className="h-32 w-full rounded-xl object-cover sm:h-auto sm:w-36" />
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <p className="text-xs font-bold tracking-wide text-info uppercase">Next from {organizerName || "this organiser"}</p>
        <p className="text-lg font-extrabold text-foreground">{next.name}</p>
        <p className="text-sm text-muted-foreground">
          {formatEventTime(next.date, next.timezone, { withYear: false })}
          {next.venue?.name ? ` · ${next.venue.name}` : ""}
        </p>
        <Button asChild className="mt-2 w-fit rounded-xl">
          <Link href={`${ROUTES.EXPLORE.href}/event/${next.id}`}>
            Get tickets <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
};

/**
 * Below the title of an ended event: the organiser's recap, their next event,
 * and photos from the crowd with "Were you there?" for ticket holders.
 */
export const HighlightsDetails = memo(
  ({ eventId, eventName, organizerId, organizerName }: { eventId: string; eventName: string; organizerId?: string; organizerName?: string }) => {
    const router = useRouter();
    const pathname = usePathname();
    const signedIn = !!useUserStore((state) => state.userDetails);
    const { data } = useEventHighlights(eventId);
    const [adding, setAdding] = useState(false);
    const [open, setOpen] = useState<number | null>(null);
    if (!data?.over) return null;

    const crowd = data.crowd;
    // Signed out: show the way in; signed in: only ticket holders who still can.
    const showAdd = data.crowdOpen && (!signedIn || !!data.me?.canAdd);
    const addPhotos = () =>
      signedIn ? setAdding(true) : router.push(`${ROUTES.LOGIN.href}?redirect=${encodeURIComponent(pathname)}`);

    return (
      <div className="space-y-8">
        {(data.recap || data.attendance || organizerId) && (
          <div className="grid gap-4 lg:grid-cols-2">
            {(data.recap || data.attendance) && (
              <section aria-label="Recap" className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/40 p-5">
                <p className="text-xs font-bold tracking-wide text-info uppercase">From the organiser</p>
                {data.recap && <p className="text-xl leading-snug font-bold text-foreground">&ldquo;{data.recap}&rdquo;</p>}
                {data.attendance && (
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-sm font-bold text-foreground">
                    <Users className="size-4" aria-hidden /> {data.attendance} turned up
                  </span>
                )}
              </section>
            )}
            {organizerId && <NextEvent eventId={eventId} organizerId={organizerId} organizerName={organizerName} />}
          </div>
        )}

        {(crowd.length > 0 || showAdd) && (
          <section aria-labelledby="crowd-title" className="space-y-3">
            <div className="space-y-1">
              <h2 id="crowd-title" className="text-xl font-bold text-foreground">From the crowd</h2>
              <p className="text-sm text-muted-foreground">
                Photos and clips from people who were there. The organiser approves each one.
              </p>
            </div>
            {!!data.me?.pending && (
              <p className="inline-flex items-center gap-1.5 rounded-full border border-warning-line bg-warning-soft px-3 py-1 text-sm font-semibold text-warning">
                <Clock className="size-3.5" aria-hidden /> {data.me.pending} of yours waiting for approval
              </p>
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {showAdd && (
                <button
                  type="button"
                  onClick={addPhotos}
                  className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-info-line bg-info-soft p-4 text-center transition-colors hover:border-primary"
                >
                  <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Camera className="size-5" aria-hidden />
                  </span>
                  <span className="text-base font-extrabold text-foreground">Were you there?</span>
                  <span className="text-sm text-muted-foreground">
                    {signedIn ? "Add your photos and clips" : "Sign in to add your photos"}
                  </span>
                </button>
              )}
              {crowd.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setOpen(index)}
                  aria-label={`View ${item.type === "video" ? "clip" : "photo"} from ${item.by}`}
                  className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-secondary-900"
                >
                  <Media item={item} className="transition-transform duration-500 group-hover:scale-[1.03]" />
                  {item.type === "video" && (
                    <span className="absolute inset-0 m-auto flex size-11 items-center justify-center rounded-full bg-white/90 text-secondary-950">
                      <Play className="size-4 fill-current" aria-hidden />
                    </span>
                  )}
                  <span className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-black/65 px-2.5 py-1 text-xs font-bold text-white">
                    {item.by}
                    {item.type === "video" && clipLength(item.durationSeconds) ? ` · ${clipLength(item.durationSeconds)}` : ""}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <Viewer eventId={eventId} items={crowd} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
        {data.me && (
          <AddCrowdPhotos
            eventId={eventId}
            eventName={eventName}
            remaining={data.me.remaining}
            open={adding}
            onOpenChange={setAdding}
          />
        )}
      </div>
    );
  },
);
HighlightsDetails.displayName = "HighlightsDetails";
