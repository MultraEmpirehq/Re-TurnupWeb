"use client";

import BoostDialog from "./boost-dialog";
import PromoterCodes from "./promoter-codes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IEventPromotion, useEventPromotion } from "@/hooks/use-promotion";
import { formatEventDateRange, formatEventTime } from "@/lib/event-time";
import { eventShareUrl } from "@/lib/share-ref";
import { IEventDetailsType } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Check,
  Circle,
  Copy,
  Download,
  Loader2,
  RefreshCw,
  Share2, Rocket } from "lucide-react";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import {
  PICTURE_SIZES,
  TPictureFormat,
  drawSharePicture,
  loadImage,
} from "./share-picture";

/** Every missing item is fixed in the event editor. */
const fixHref = (eventId: string) => `/app/events/${eventId}/edit`;

const whenOf = (event: IEventDetailsType) =>
  (event.days?.length ?? 0) > 1 && event.endDate
    ? formatEventDateRange(event.date, event.endDate, event.timezone)
    : formatEventTime(event.date, event.timezone, { withYear: false });

const placeOf = (event: IEventDetailsType) =>
  [event.venue?.name ?? event.venueName, event.eventCity]
    .filter(Boolean)
    .join(", ");

const headlinersOf = (event: IEventDetailsType) =>
  (event.performers ?? [])
    .filter((performer) => performer.isHeadliner)
    .map((performer) => performer.name);

/** A few ways to say it, all from the event's own details. */
const captionsFor = (
  event: IEventDetailsType,
  price: string | null,
  link: string,
) => {
  const when = whenOf(event);
  const place = placeOf(event);
  const acts = headlinersOf(event);
  const days = event.days?.length ?? 0;
  const priceLine = price ? `Tickets from ${price}` : "Get your ticket";
  return [
    [
      `${days > 1 ? `${days} days. ` : ""}${event.name} 🎉`,
      `${when}${place ? ` · ${place}` : ""}`,
      acts.length
        ? `With ${acts.slice(0, 3).join(", ")}${acts.length > 3 ? " and more" : ""} 🔥`
        : null,
      `${priceLine} → ${link}`,
    ],
    [
      `Save the date: ${event.name}.`,
      `${when}${place ? ` at ${place}` : ""}.`,
      `${priceLine}, and see you there 👉 ${link}`,
    ],
    [
      `Who's coming? 👀 ${event.name}${place ? ` in ${event.eventCity ?? place}` : ""}`,
      acts.length ? `${acts[0]} on the bill.` : null,
      `${when}. ${priceLine}: ${link}`,
    ],
  ].map((lines) => lines.filter(Boolean).join("\n"));
};

const AUTOMATION_ICON = {
  followers: "🔔",
  savers: "⏰",
  holders: "💬",
} as const;
const AUDIENCE = {
  followers: (count: number) => (count === 1 ? "follower" : "followers"),
  savers: (count: number) =>
    count === 1 ? "person saved it" : "people saved it",
  holders: (count: number) =>
    count === 1 ? "ticket holder" : "ticket holders",
} as const;
const shortWhen = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const copy = async (text: string, done: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(done);
  } catch {
    toast.error("Couldn't copy. Select the text and copy it instead.");
  }
};

const Checklist: React.FC<{ eventId: string; promotion: IEventPromotion }> = ({
  eventId,
  promotion,
}) => (
  <ul className="grid gap-1.5 sm:grid-cols-2">
    {promotion.checklist.map((item) => (
      <li
        key={item.id}
        className="flex items-center justify-between gap-2 rounded-xl bg-secondary-50/70 px-3 py-2 text-sm"
      >
        <span className="flex items-center gap-2">
          {item.done ? (
            <Check className="size-4 text-emerald-600" aria-hidden />
          ) : (
            <Circle className="size-4 text-amber-500" aria-hidden />
          )}
          <span
            className={
              item.done
                ? "text-secondary-700"
                : "font-semibold text-secondary-950"
            }
          >
            {item.label}
            {item.optional && !item.done && (
              <span className="font-normal text-secondary-400">
                {" "}
                · optional
              </span>
            )}
          </span>
        </span>
        {!item.done && (
          <Link
            href={fixHref(eventId)}
            className="shrink-0 text-xs font-bold text-secondary-700 hover:underline"
          >
            Fix
          </Link>
        )}
      </li>
    ))}
  </ul>
);

/**
 * Promote an event: whether it's ready (and what to fix), a share picture to
 * download, the organiser's own link (sales through it are counted as theirs),
 * captions to copy, one-tap sharing, and where buyers came from this week.
 */
const PromoteDialog: React.FC<{
  event: IEventDetailsType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ event, open, onOpenChange }) => {
  const { data: promotion, isLoading } = useEventPromotion(event.id, open);
  const [format, setFormat] = useState<TPictureFormat>("story");
  const [boosting, setBoosting] = useState(false);
  const [captionIndex, setCaptionIndex] = useState(0);
  const [drawing, setDrawing] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrRef = useRef<HTMLCanvasElement>(null);

  const link = eventShareUrl(event.id, promotion?.share.ref);
  const price = promotion?.share.fromPrice?.formatted?.withCurrency ?? null;
  // "₦15,000" reads better on a picture than "₦15,000.00".
  const fromPrice = price ? `From ${price.replace(/[.,]00$/, "")}` : null;
  const captions = useMemo(
    () => captionsFor(event, price, link),
    [event, link, price],
  );
  const caption = captions[captionIndex % captions.length];
  const days = event.days?.length ?? 0;

  useEffect(() => {
    if (!open || !promotion) return;
    let cancelled = false;
    setDrawing(true);
    void loadImage(event.image || event.medias?.[0]).then((image) => {
      if (cancelled || !canvasRef.current) return;
      drawSharePicture(canvasRef.current, format, {
        name: event.name,
        when: whenOf(event),
        where: placeOf(event),
        price: fromPrice,
        tag:
          days > 1
            ? `${days} DAYS`
            : (event.category?.name?.toUpperCase() ?? null),
        image,
        qr: qrRef.current,
      });
      setDrawing(false);
    });
    return () => {
      cancelled = true;
    };
  }, [days, event, format, fromPrice, open, promotion]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${event.name.replace(/[^\w]+/g, "-").toLowerCase()}-${format}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch {
      // The cover couldn't be drawn for download (the image host refused); it's still shown.
      toast.error(
        "Couldn't make the picture. Try again, or use a different cover.",
      );
    }
  };

  const shareText = encodeURIComponent(caption);
  const channels = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${shareText}`,
      className: "bg-emerald-50 text-emerald-800",
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${shareText}`,
      className: "bg-secondary-50 text-secondary-900",
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
      className: "bg-blue-50 text-blue-800",
    },
    {
      label: "Email",
      href: `mailto:?subject=${encodeURIComponent(event.name)}&body=${shareText}`,
      className: "bg-secondary-50 text-secondary-900",
    },
  ];
  const sources = promotion?.sales.sources;
  const sourceTotal = sources
    ? sources.yourLink +
      sources.attendeeShares +
      sources.promoCodes +
      sources.followers +
      sources.turnupz
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto rounded-[1.6rem] p-0 sm:max-w-4xl">
        <DialogHeader className="flex flex-row flex-wrap items-start justify-between gap-3 border-b border-secondary-100 px-6 py-4 text-left">
          <div>
            <DialogTitle className="text-xl font-extrabold text-secondary-950">
              Promote {event.name}
            </DialogTitle>
            <DialogDescription className="text-sm text-secondary-500">
              Your link is tagged to you, so you can see which sales it brings.
            </DialogDescription>
          </div>
          {promotion && (
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold",
                promotion.ready
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-800",
              )}
            >
              {promotion.ready ? "✓ " : ""}
              {promotion.score.done} of {promotion.score.total} ready
            </span>
          )}
        </DialogHeader>

        {isLoading || !promotion ? (
          <div className="flex justify-center py-20">
            <Loader2
              className="size-6 animate-spin text-secondary-400"
              aria-label="Loading"
            />
          </div>
        ) : (
          <div className="space-y-6 p-6">
            {promotion.ready && (
              <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-linear-to-r from-secondary-700 to-primary p-4 text-white">
                <div>
                  <p className="font-extrabold">Show it first on Turnupz</p>
                  <p className="text-sm text-white/85">
                    Boost it to the top of Home, Explore or search in your city, labelled Sponsored.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setBoosting(true)}
                  className="rounded-xl bg-white font-bold text-secondary-900 hover:bg-white/90"
                >
                  <Rocket className="size-4" aria-hidden />
                  Boost
                </Button>
              </section>
            )}

            {!promotion.ready && (
              <section className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
                <p className="text-sm font-semibold text-secondary-900">
                  {promotion.isUpcoming
                    ? "A few things make people far more likely to buy. Fix them first, or promote anyway."
                    : "This event is over, so there's nothing left to promote."}
                </p>
                <Checklist eventId={event.id} promotion={promotion} />
              </section>
            )}

            <div className="grid gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
              <section className="space-y-2">
                <div
                  className={cn(
                    "relative mx-auto overflow-hidden rounded-2xl bg-secondary-100 shadow-lg",
                    format === "story"
                      ? "w-[220px]"
                      : format === "square"
                        ? "w-[260px]"
                        : "w-[240px]",
                  )}
                  style={{
                    aspectRatio: `${PICTURE_SIZES[format].width} / ${PICTURE_SIZES[format].height}`,
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    className="size-full"
                    aria-label={`${PICTURE_SIZES[format].label} picture of ${event.name}`}
                  />
                  {drawing && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="size-5 animate-spin text-secondary-400" />
                    </div>
                  )}
                </div>
                <div
                  role="radiogroup"
                  aria-label="Picture size"
                  className="grid grid-cols-3 gap-1.5"
                >
                  {(Object.keys(PICTURE_SIZES) as TPictureFormat[]).map(
                    (key) => (
                      <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={format === key}
                        onClick={() => setFormat(key)}
                        className={cn(
                          "rounded-lg py-1.5 text-xs font-bold",
                          format === key
                            ? "bg-secondary-900 text-white"
                            : "bg-secondary-50 text-secondary-700 hover:bg-secondary-100",
                        )}
                      >
                        {PICTURE_SIZES[key].label}
                      </button>
                    ),
                  )}
                </div>
                <Button
                  type="button"
                  onClick={download}
                  disabled={drawing}
                  className="h-10 w-full rounded-xl bg-secondary-700 font-bold text-white hover:bg-secondary-800"
                >
                  <Download className="size-4" aria-hidden />
                  Download picture
                </Button>
                {/* The QR drawn into the picture. */}
                <QRCodeCanvas
                  ref={qrRef}
                  value={link}
                  size={512}
                  level="M"
                  marginSize={0}
                  className="hidden"
                />
              </section>

              <section className="min-w-0 space-y-5">
                <div>
                  <p className="text-xs font-extrabold tracking-wide text-secondary-400">
                    YOUR LINK
                  </p>
                  <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-secondary-100 bg-secondary-50/60 px-3 py-2">
                    <span className="min-w-0 flex-1 truncate font-mono text-sm text-secondary-900">
                      {link}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 rounded-lg"
                      onClick={() => void copy(link, "Link copied")}
                    >
                      <Copy className="size-3.5" aria-hidden />
                      Copy
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-extrabold tracking-wide text-secondary-400">
                      CAPTION
                    </p>
                    <button
                      type="button"
                      onClick={() => setCaptionIndex((index) => index + 1)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-secondary-700 hover:underline"
                    >
                      <RefreshCw className="size-3" aria-hidden />
                      Another one
                    </button>
                  </div>
                  <p className="mt-1.5 rounded-2xl border border-secondary-100 p-3 text-sm leading-6 whitespace-pre-line text-secondary-800">
                    {caption}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-1 rounded-lg"
                    onClick={() => void copy(caption, "Caption copied")}
                  >
                    <Copy className="size-3.5" aria-hidden />
                    Copy caption
                  </Button>
                </div>

                <div>
                  <p className="text-xs font-extrabold tracking-wide text-secondary-400">
                    SHARE TO
                  </p>
                  <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {channels.map((channel) => (
                      <a
                        key={channel.label}
                        href={channel.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "rounded-2xl py-3 text-center text-xs font-bold transition-opacity hover:opacity-80",
                          channel.className,
                        )}
                      >
                        {channel.label}
                      </a>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.share) {
                          void navigator
                            .share({
                              title: event.name,
                              text: caption,
                              url: link,
                            })
                            .catch(() => undefined);
                        } else {
                          void copy(
                            `${caption}`,
                            "Caption and link copied. Paste them into Instagram.",
                          );
                        }
                      }}
                      className="inline-flex items-center justify-center gap-1 rounded-2xl bg-pink-50 py-3 text-xs font-bold text-pink-700 hover:opacity-80"
                    >
                      <Share2 className="size-3.5" aria-hidden />
                      More
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-secondary-500">
                    For Instagram: download the Story picture and copy the
                    caption.
                  </p>
                </div>

                {promotion.automations.length > 0 && (
                  <div className="rounded-2xl border border-secondary-100 p-4">
                    <p className="text-xs font-extrabold tracking-wide text-secondary-700">
                      ALREADY RUNNING FOR YOU
                    </p>
                    <ul className="mt-2 space-y-2">
                      {promotion.automations.map((item) => (
                        <li
                          key={item.key}
                          className="flex items-start justify-between gap-3 text-sm"
                        >
                          <span className="text-secondary-800">
                            {AUTOMATION_ICON[item.kind]} {item.title}
                            <span className="block text-xs text-secondary-500">
                              {item.audience.toLocaleString()}{" "}
                              {AUDIENCE[item.kind](item.audience)}
                            </span>
                          </span>
                          <span
                            className={cn(
                              "shrink-0 text-right text-xs font-bold",
                              item.status === "sent"
                                ? "text-emerald-700"
                                : "text-secondary-500",
                            )}
                          >
                            {item.status === "sent" ? "Sent " : ""}
                            {shortWhen(item.at)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="rounded-2xl bg-linear-to-r from-primary/10 to-secondary-50 p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-xs font-extrabold tracking-wide text-secondary-700">
                      THE LAST 7 DAYS
                    </p>
                    <span className="flex gap-1.5">
                      {promotion.labels.sellingFast && (
                        <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[11px] font-extrabold text-white">
                          🔥 Selling fast
                        </span>
                      )}
                      {promotion.labels.almostGone && (
                        <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-extrabold text-secondary-950">
                          Almost gone
                        </span>
                      )}
                      {promotion.labels.soldOut && (
                        <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[11px] font-extrabold text-secondary-950">
                          🏆 Sold out
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {[
                      {
                        value: promotion.sales.views.toLocaleString(),
                        label: "page views",
                      },
                      {
                        value: promotion.sales.lastWeek.toLocaleString(),
                        label: "tickets sold",
                      },
                      {
                        value:
                          promotion.sales.conversion === null
                            ? "—"
                            : `${promotion.sales.conversion}%`,
                        label: "of visitors bought",
                      },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-xl bg-white/80 px-3 py-2"
                      >
                        <p className="text-lg font-extrabold text-secondary-950 tabular-nums">
                          {stat.value}
                        </p>
                        <p className="text-[11px] text-secondary-500">
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-secondary-500">
                    {promotion.sales.visitors.toLocaleString()}{" "}
                    {promotion.sales.visitors === 1 ? "person" : "people"}{" "}
                    opened the page
                    {promotion.sales.left !== null &&
                      ` · ${promotion.sales.left.toLocaleString()} tickets left`}
                  </p>
                  {sources && sourceTotal > 0 ? (
                    <ul className="mt-3 space-y-1.5 text-sm">
                      {[
                        { label: "Your link", value: sources.yourLink },
                        { label: "Promoter codes", value: sources.promoCodes },
                        {
                          label: "Followers and reminders",
                          value: sources.followers,
                        },
                        {
                          label: "Attendees sharing",
                          value: sources.attendeeShares,
                        },
                        {
                          label: "Turnupz (Explore, search, the app)",
                          value: sources.turnupz,
                        },
                      ]
                        .filter(
                          (row) => row.value > 0 || row.label === "Your link",
                        )
                        .map((row) => (
                          <li
                            key={row.label}
                            className="flex items-center gap-3"
                          >
                            <span className="w-44 shrink-0 text-secondary-700">
                              {row.label}
                            </span>
                            <span className="h-2 flex-1 rounded-full bg-white">
                              <span
                                className="block h-2 rounded-full bg-secondary-500"
                                style={{
                                  width: `${(row.value / sourceTotal) * 100}%`,
                                }}
                              />
                            </span>
                            <b className="w-8 text-right tabular-nums text-secondary-950">
                              {row.value}
                            </b>
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-xs text-secondary-500">
                      Once people buy through your link, you&apos;ll see it
                      here.
                    </p>
                  )}
                  {promotion.sales.promoCodes.length > 0 && (
                    <p className="mt-2 text-xs text-secondary-600">
                      Codes this week:{" "}
                      {promotion.sales.promoCodes
                        .map((row) => `${row.code} ${row.tickets}`)
                        .join(" · ")}
                    </p>
                  )}
                </div>

                <PromoterCodes
                  eventId={event.id}
                  currency={
                    promotion.share.fromPrice?.currency?.code ??
                    event.currency ??
                    "NGN"
                  }
                />
              </section>
            </div>
          </div>
        )}
      </DialogContent>
      {boosting && <BoostDialog event={event} open={boosting} onOpenChange={setBoosting} />}
    </Dialog>
  );
};

export default memo(PromoteDialog);
