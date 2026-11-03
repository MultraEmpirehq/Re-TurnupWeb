"use client";

import React, { memo, useCallback, useEffect, useState } from "react";
import CustomImageComponent from "@/components/ui/custom-image.component";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";

export type TMediaItem = { url: string; type?: string | null };

const VIDEO_URL = /\/video\/upload\/|\.(mp4|mov|webm|m4v)(\?|#|$)/i;

/** A video by its stored type, or (for older items) by its address. */
export const isVideo = (item: TMediaItem) =>
  item.type ? item.type.toUpperCase() === "VIDEO" : VIDEO_URL.test(item.url);

/** The gallery's items: typed when the event has them, else plain urls. */
export const mediaItemsOf = (
  details?: { url?: string; type?: string | null }[] | null,
  urls?: (string | undefined)[] | null,
): TMediaItem[] => {
  const typed = (details ?? [])
    .filter((item): item is { url: string; type?: string | null } => !!item?.url)
    .map((item) => ({ url: item.url, type: item.type ?? null }));
  if (typed.length) return typed;
  return (urls ?? []).filter((url): url is string => !!url).map((url) => ({ url }));
};

/**
 * Photos and videos full size, one at a time, with arrows (and the keyboard's)
 * to move between them.
 */
export const MediaLightbox = ({
  items,
  index,
  onIndexChange,
  onClose,
  title,
}: {
  items: TMediaItem[];
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  title?: string;
}) => {
  const open = index !== null && !!items[index];
  const go = useCallback(
    (by: -1 | 1) => {
      if (index === null) return;
      onIndexChange((index + by + items.length) % items.length);
    },
    [index, items.length, onIndexChange],
  );
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, open]);
  const item = open ? items[index!] : null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="z-[10000] h-[100dvh] max-h-none w-screen max-w-none translate-none rounded-none border-0 bg-black p-0 sm:max-w-none top-0 left-0"
      >
        <DialogTitle className="sr-only">{title ?? "Event media"}</DialogTitle>
        {item && (
          <div className="relative flex size-full items-center justify-center">
            {isVideo(item) ? (
              <video
                key={item.url}
                src={item.url}
                controls
                autoPlay
                playsInline
                className="max-h-[88dvh] max-w-[92vw] rounded-lg"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={item.url}
                src={item.url}
                alt={title ?? "Event media"}
                className="max-h-[88dvh] max-w-[92vw] rounded-lg object-contain"
              />
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="size-5" />
            </button>
            {items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous"
                  className="absolute left-3 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-6"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next"
                  className="absolute right-3 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-6"
                >
                  <ChevronRight className="size-6" />
                </button>
                <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                  {index! + 1} / {items.length}
                </p>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

/** A tile's picture: the photo, or the video's first frame with a play mark. */
export const MediaThumb = ({ item, alt }: { item: TMediaItem; alt: string }) =>
  isVideo(item) ? (
    <>
      <video
        src={`${item.url}#t=0.1`}
        muted
        playsInline
        preload="metadata"
        className="absolute inset-0 size-full object-cover"
      />
      <span className="absolute inset-0 grid place-items-center bg-black/20">
        <span className="grid size-12 place-items-center rounded-full bg-white/90 text-secondary-950 shadow">
          <Play className="ml-0.5 size-5 fill-current" />
        </span>
      </span>
    </>
  ) : (
    <CustomImageComponent src={item.url} alt={alt} fill className="size-full" imageClassName="object-cover" />
  );

interface EventDetailMediaProps {
  items: TMediaItem[];
  eventName?: string;
}

/**
 * The gallery as a strip of same-size tiles, so one picture or twenty take the
 * same height. Tapping one opens it full size; videos play there.
 */
const EventDetailMedia = ({ items, eventName }: EventDetailMediaProps) => {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold">Event Media</h3>
      <Carousel className="w-full" opts={{ align: "start" }}>
        <CarouselContent className="-ml-3">
          {items.map((item, index) => (
            <CarouselItem key={`${item.url}-${index}`} className="basis-4/5 pl-3 sm:basis-1/2 lg:basis-1/3">
              <button
                type="button"
                onClick={() => setOpen(index)}
                aria-label={`Open ${isVideo(item) ? "video" : "photo"} ${index + 1} of ${items.length}`}
                className="relative block h-48 w-full cursor-zoom-in overflow-hidden rounded-xl bg-muted sm:h-56"
              >
                <MediaThumb item={item} alt={eventName || "Event media"} />
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>
        {items.length > 1 && (
          <>
            <CarouselPrevious className="left-2 bg-white/90 shadow-sm disabled:hidden" />
            <CarouselNext className="right-2 bg-white/90 shadow-sm disabled:hidden" />
          </>
        )}
      </Carousel>
      <MediaLightbox
        items={items}
        index={open}
        onIndexChange={setOpen}
        onClose={() => setOpen(null)}
        title={eventName}
      />
    </section>
  );
};

export default memo(EventDetailMedia);
