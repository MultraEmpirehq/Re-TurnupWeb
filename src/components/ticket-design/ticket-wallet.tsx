"use client";

import {
  formatEventDateRange,
  formatEventTime,
  ticketDaysNote,
} from "@/lib/event-time";
import { IEventDetailsType, UserTicketDetailsResponseType } from "@/lib/types";
import { ROUTES } from "@/lib/variables";
import { cn } from "@/lib/utils";
import { postData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { toast } from "@/lib/toast";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import LiveTicketQr from "./live-ticket-qr";

/**
 * My tickets, in the app's look: one card per event (however many tickets you
 * hold for it), with its first ticket's code peeking out. Opening one shows
 * your passes, one per ticket, each with its live QR code for the door.
 */

export type TEventTickets = {
  event: IEventDetailsType;
  tickets: UserTicketDetailsResponseType[];
};

const STATUS = {
  UN_USED: { label: "Ready", className: "bg-[#e8f8ef] text-[#15803d]" },
  USED: { label: "Checked in", className: "bg-[#f1f2f5] text-[#52525b]" },
  EXPIRED: { label: "Expired", className: "bg-[#f1f2f5] text-[#52525b]" },
  CANCELLED: { label: "Cancelled", className: "bg-[#ffe4e6] text-[#be123c]" },
} as const;
const NOT_USED = {
  label: "Not used",
  className: "bg-[#f1f2f5] text-[#52525b]",
};
const PENDING = {
  label: "Awaiting approval",
  className: "bg-amber-50 text-amber-700",
};
const REJECTED = {
  label: "Not approved",
  className: "bg-[#ffe4e6] text-[#be123c]",
};

/** Solid pass colours (no photo behind the words, so they always read clearly). */
const PASS_COLOURS = ["#07141D", "#0E2A44", "#0566D6"];
const PAST_COLOUR = "#52525B";

const isMultiDay = (event: IEventDetailsType) => (event.days?.length ?? 0) > 1;

/** An event counts as past six hours after it starts (after its last day, for a multi-day event). */
export const isPastEvent = (event: IEventDetailsType) =>
  new Date(event.endDate ?? event.date).getTime() <
  Date.now() - 6 * 60 * 60 * 1000;

/** Tickets grouped by event: soonest first, or most recent first for past ones. */
export const groupByEvent = (tickets: UserTicketDetailsResponseType[]) => {
  const byEvent = new Map<string, TEventTickets>();
  for (const ticket of tickets) {
    const event = ticket.ticket?.event;
    if (!event?.id) continue;
    const group = byEvent.get(event.id) ?? { event, tickets: [] };
    group.tickets.push(ticket);
    byEvent.set(event.id, group);
  }
  const groups = [...byEvent.values()];
  const time = (group: TEventTickets) => new Date(group.event.date).getTime();
  return {
    upcoming: groups
      .filter((g) => !isPastEvent(g.event))
      .sort((a, b) => time(a) - time(b)),
    past: groups
      .filter((g) => isPastEvent(g.event))
      .sort((a, b) => time(b) - time(a)),
  };
};

/** A ticket's state; once the event is over an unused ticket is "Not used", never "Ready". */
export const statusOf = (
  ticket: UserTicketDetailsResponseType,
  event: IEventDetailsType,
) => {
  if (ticket.registrationStatus === "PENDING") return PENDING;
  if (ticket.registrationStatus === "REJECTED") return REJECTED;
  // A multi-day pass is scanned once a day, so it stays ready until the last day.
  if (isMultiDay(event) && !isPastEvent(event)) return STATUS.UN_USED;
  const status =
    STATUS[(ticket.status as keyof typeof STATUS) ?? "UN_USED"] ??
    STATUS.UN_USED;
  return isPastEvent(event) && status === STATUS.UN_USED ? NOT_USED : status;
};

const isUsable = (
  ticket: UserTicketDetailsResponseType,
  event: IEventDetailsType,
) => statusOf(ticket, event) === STATUS.UN_USED;

const whenOf = (event: IEventDetailsType) =>
  isMultiDay(event) && event.endDate
    ? formatEventDateRange(event.date, event.endDate, event.timezone)
    : formatEventTime(event.date, event.timezone, { withYear: false });

const placeOf = (event: IEventDetailsType) =>
  event.venue?.name ?? event.venueName ?? event.venueAddress ?? "";

/** "2 × Regular · 1 × VIP" for the tickets you hold. */
const typesOf = (tickets: UserTicketDetailsResponseType[]) => {
  const counts = new Map<string, number>();
  for (const ticket of tickets) {
    const name = ticket.ticket?.name || "Ticket";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts].map(([name, count]) => `${count} × ${name}`).join(" · ");
};

/**
 * Free tickets can't be passed on, nor used ones; otherwise the ticket type
 * decides. One already on its way shows "View transfer".
 */
const isFreePlace = (ticket: UserTicketDetailsResponseType) =>
  ticket.ticket.type?.toUpperCase() === "FREE" ||
  !(Number(ticket.ticket.price?.amount ?? 0) > 0);

/** Gives up a free ticket or registration, after asking. */
const CancelPlaceButton: React.FC<{ ticketId: string; eventName?: string }> = ({
  ticketId,
  eventName,
}) => {
  const queryClient = useQueryClient();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const cancel = async () => {
    setBusy(true);
    try {
      await postData(`/ticket/${ticketId}/cancel-place`, {});
      await queryClient.invalidateQueries({ queryKey: ["user-tickets"] });
      toast.success("Your place was cancelled.");
      setAsking(false);
    } catch (error) {
      toast.error(constructErrorMessage(error as TApiErrorResponseType, "We couldn't cancel your place."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="mt-3 text-sm font-semibold text-zinc-500 underline-offset-2 hover:text-red-600 hover:underline"
      >
        Cancel my place
      </button>
      <ConfirmDialog
        open={asking}
        title="Cancel your place?"
        description={`Your place${eventName ? ` at ${eventName}` : ""} goes back for someone else. You can get another if any are left.`}
        confirmLabel="Cancel my place"
        tone="danger"
        busy={busy}
        onCancel={() => setAsking(false)}
        onConfirm={() => void cancel()}
      />
    </>
  );
};

const canTransfer = (ticket: UserTicketDetailsResponseType) => {
  const price = Number(ticket.ticket.price?.amount ?? 0);
  if (ticket.ticket.type?.toUpperCase() === "FREE" || !(price > 0))
    return false;
  if (
    ticket.registrationStatus === "PENDING" ||
    ticket.registrationStatus === "REJECTED"
  )
    return false;
  if ((ticket.status ?? "UN_USED") !== "UN_USED") return false;
  return ticket.ticket.isTransferable ?? ticket.ticket.transferable ?? false;
};

export const PASS_COLOUR = PASS_COLOURS[0];

export const colourOf = (group: TEventTickets, index: number) =>
  isPastEvent(group.event)
    ? PAST_COLOUR
    : PASS_COLOURS[Math.max(index, 0) % PASS_COLOURS.length];

/** The top of a pass: a small photo, the event, when and where, on a solid colour. */
export const PassHeader = ({
  event,
  colour,
  right,
}: {
  event: IEventDetailsType;
  colour: string;
  right?: React.ReactNode;
}) => {
  const image = event.image || event.medias?.[0];
  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5"
      style={{ backgroundColor: colour }}
    >
      <span className="size-11 shrink-0 overflow-hidden rounded-xl bg-white/15">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="size-full object-cover" />
        )}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-base font-bold text-white">
          {event.name}
        </span>
        <span className="block truncate text-xs text-white/75">
          {[whenOf(event), placeOf(event)].filter(Boolean).join(" · ")}
        </span>
      </span>
      {right}
    </div>
  );
};

/** The dashed tear across a ticket, with a notch bitten out of each side. */
const TearLine = ({ notch }: { notch: string }) => (
  <div className="relative h-0" aria-hidden>
    <div className="absolute inset-x-[18px] -top-px border-t-2 border-dashed border-[#D9E0E8]" />
    <span
      className="absolute -top-[11px] -left-[11px] size-[22px] rounded-full"
      style={{ backgroundColor: notch }}
    />
    <span
      className="absolute -top-[11px] -right-[11px] size-[22px] rounded-full"
      style={{ backgroundColor: notch }}
    />
  </div>
);

/** One event's card: its coloured top, the tear, then a peek of the first ticket's code. */
export const EventPassCard = memo(function EventPassCard({
  group,
  colour,
  background,
  onOpen,
}: {
  group: TEventTickets;
  colour: string;
  /** The page colour behind the card, for the notches in the tear. */
  background: string;
  onOpen: () => void;
}) {
  const past = isPastEvent(group.event);
  const ticket =
    group.tickets.find((t) => isUsable(t, group.event)) ?? group.tickets[0];
  const status = statusOf(ticket, group.event);
  const count = group.tickets.length;
  const label = past
    ? ticket.status === "USED"
      ? "Checked in"
      : "Ended"
    : status.label;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Show your ${count > 1 ? `${count} passes` : "pass"} for ${group.event.name}`}
      className="group block w-full overflow-hidden rounded-3xl bg-white text-left shadow-[0_8px_24px_-12px_rgba(7,20,29,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-12px_rgba(7,20,29,0.4)] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
    >
      <PassHeader
        event={group.event}
        colour={colour}
        right={
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold text-white">
            {count}
          </span>
        }
      />
      <TearLine notch={background} />
      <div className="px-4 pt-3 pb-3">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-xs font-semibold text-zinc-500">
            {typesOf(group.tickets)}
          </span>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold",
              status.className,
            )}
          >
            {label}
          </span>
        </div>
        {past ? (
          <div className="mt-3 rounded-2xl bg-zinc-50 px-4 py-5 text-center">
            <p className="text-base font-extrabold text-zinc-950">
              Event ended
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {group.tickets.some((t) => t.status === "USED")
                ? "You checked in. Hope it was a good one!"
                : "These tickets weren't used."}
            </p>
          </div>
        ) : (
          // Half the code peeks out, fading away, so it's clear there's more.
          <div className="relative mt-3 flex h-[106px] justify-center overflow-hidden">
            <LiveTicketQr ticket={ticket} size={176} usable compact />
            <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-b from-white/0 to-white" />
          </div>
        )}
        <p className="mt-1 text-center text-xs font-bold text-[#0566D6] group-hover:underline">
          {count > 1 ? `Show your ${count} passes` : "Show your pass"}
        </p>
      </div>
    </button>
  );
});

/** The QR's size: as big as fits, smaller on short screens, so the whole pass shows. */
const useQrSize = () => {
  const [size, setSize] = useState(200);
  useEffect(() => {
    // Everything around the code (bars, the pass's header, details and buttons) takes about 480px.
    const fit = () =>
      setSize(
        Math.round(Math.max(120, Math.min(200, window.innerHeight - 480))),
      );
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return size;
};

const passButton =
  "inline-flex h-10 flex-1 items-center justify-center rounded-full text-sm font-semibold transition";

/** One pass: the event on top, then the QR (or, once it's over, how it went), its details and what you can do with it. */
const Pass = ({
  group,
  ticket,
  colour,
  qrSize,
}: {
  group: TEventTickets;
  ticket: UserTicketDetailsResponseType;
  colour: string;
  qrSize: number;
}) => {
  const past = isPastEvent(group.event);
  const status = statusOf(ticket, group.event);
  const usable = !past && status === STATUS.UN_USED;
  const blocked =
    ticket.registrationStatus === "PENDING" ||
    ticket.registrationStatus === "REJECTED";
  const daysNote = ticketDaysNote(ticket.ticket?.dayIds, group.event);
  const transfer = canTransfer(ticket) && !past;
  return (
    <div className="w-[min(340px,calc(100vw-48px))] shrink-0 snap-center overflow-hidden rounded-3xl bg-white">
      <PassHeader event={group.event} colour={colour} />
      <div className="flex flex-col items-center px-5 pt-4 pb-4">
        {past ? (
          <div className="w-full rounded-2xl bg-zinc-50 px-4 py-6 text-center">
            <p className="text-lg font-extrabold text-zinc-950">Event ended</p>
            <p className="mt-1 text-sm text-zinc-500">
              {ticket.status === "USED"
                ? "You checked in. Hope it was a good one!"
                : "This ticket wasn't used."}
            </p>
          </div>
        ) : blocked ? (
          <div className="w-full rounded-2xl bg-zinc-50 px-4 py-6 text-center">
            <p className="text-lg font-extrabold text-zinc-950">
              {ticket.registrationStatus === "PENDING"
                ? "Waiting for approval"
                : "Registration not approved"}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              {ticket.registrationStatus === "PENDING"
                ? "Your code shows here once the organiser approves your registration."
                : "The organiser didn't approve this registration."}
            </p>
          </div>
        ) : (
          <LiveTicketQr
            ticket={ticket}
            size={qrSize}
            usable={usable}
            holderName={ticket.currentHolderName}
          />
        )}
        <p className="mt-2 text-xs font-semibold tracking-widest text-zinc-500">
          {(ticket.code || ticket.id).toUpperCase()}
        </p>
        <div className="mt-3 flex w-full justify-between gap-4 text-left">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] tracking-wider text-zinc-400 uppercase">
              Ticket
            </p>
            <p className="truncate text-base font-bold text-zinc-950">
              {ticket.ticket?.name ?? "Ticket"}
            </p>
            {daysNote && (
              <p className="mt-0.5 text-xs font-bold text-[#0577FA]">
                {daysNote}
              </p>
            )}
          </div>
          {ticket.currentHolderName && (
            <div className="min-w-0 flex-1">
              <p className="text-[11px] tracking-wider text-zinc-400 uppercase">
                Holder
              </p>
              <p className="truncate text-sm font-semibold text-zinc-900">
                {ticket.currentHolderName}
              </p>
            </div>
          )}
          <div className="text-right">
            <p className="text-[11px] tracking-wider text-zinc-400 uppercase">
              Status
            </p>
            <span
              className={cn(
                "mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold",
                status.className,
              )}
            >
              {status.label}
            </span>
          </div>
        </div>
        {isFreePlace(ticket) &&
          !past &&
          ticket.registrationStatus !== "REJECTED" &&
          (status === STATUS.UN_USED || ticket.registrationStatus === "PENDING") && (
            <CancelPlaceButton ticketId={ticket.id} eventName={group.event?.name} />
          )}
        {(transfer || ticket.orderId) && (
          <div className="mt-4 flex w-full gap-2">
            {transfer && (
              <Link
                href={`${ROUTES.PROFILE_TICKETS.href}/transfer/${ticket.id}`}
                className={cn(
                  passButton,
                  "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
                )}
              >
                {ticket.transfer?.status === "PENDING"
                  ? "View transfer"
                  : "Transfer"}
              </Link>
            )}
            {/* Receipts and help live with the order (only yours, not one sent to you). */}
            {ticket.orderId && (
              <Link
                href={`${ROUTES.PROFILE_ORDERS.href}/${ticket.orderId}`}
                className={cn(
                  passButton,
                  "bg-[#0b1d2a] text-white hover:bg-[#13304a]",
                )}
              >
                View order
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const arrowButton =
  "hidden size-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:pointer-events-none disabled:opacity-30 sm:flex";

/**
 * Your passes for one event, side by side when there are several: swipe, the
 * arrows or the arrow keys move between them. Escape or the dark space closes it.
 */
export const PassViewer = ({
  group,
  colour,
  onClose,
  startAt = 0,
  hideOrderLink = false,
}: {
  group: TEventTickets | null;
  colour: string;
  onClose: () => void;
  /** Which pass to open on. */
  startAt?: number;
  /** Already on the order's page, so "View order" would go nowhere. */
  hideOrderLink?: boolean;
}) => {
  const [page, setPage] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const qrSize = useQrSize();
  const count = group?.tickets.length ?? 0;

  const goTo = useCallback((index: number, smooth = true) => {
    const el = scroller.current?.children[index] as HTMLElement | undefined;
    el?.scrollIntoView({
      behavior: smooth ? "smooth" : "instant",
      inline: "center",
      block: "nearest",
    });
  }, []);

  useEffect(() => {
    if (!group) return;
    const first = Math.min(Math.max(startAt, 0), group.tickets.length - 1);
    setPage(first);
    requestAnimationFrame(() => goTo(first, false));
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [group, startAt, goTo]);

  useEffect(() => {
    if (!group) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight" && page < count - 1) goTo(page + 1);
      if (event.key === "ArrowLeft" && page > 0) goTo(page - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [group, onClose, page, count, goTo]);

  if (!group) return null;
  const past = isPastEvent(group.event);
  const tickets = hideOrderLink
    ? group.tickets.map((ticket) => ({ ...ticket, orderId: undefined }))
    : group.tickets;

  // Straight into the page body and above the site header (z-9999), so nothing covers it.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Your passes for ${group.event.name}`}
      className="fixed inset-0 z-[10001] flex flex-col bg-[#0b1d2a]"
      onClick={onClose}
    >
      <div className="flex h-16 shrink-0 items-center justify-between gap-4 px-5">
        <p className="min-w-0 truncate text-base font-bold text-white sm:text-lg">
          <span className="hidden sm:inline">{group.event.name} · </span>
          {count > 1 ? `Pass ${page + 1} of ${count}` : "Your pass"}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center gap-4 sm:px-6">
        {count > 1 && (
          <button
            type="button"
            aria-label="Previous pass"
            disabled={page === 0}
            onClick={(event) => {
              event.stopPropagation();
              goTo(page - 1);
            }}
            className={arrowButton}
          >
            <ChevronLeft className="size-6" />
          </button>
        )}
        <div
          ref={scroller}
          className="scrollbar-none flex h-full w-full min-w-0 snap-x snap-mandatory items-center gap-4 overflow-x-auto px-[max(24px,calc(50%-170px))] py-2 sm:w-[372px] sm:flex-none sm:px-4"
          onScroll={(event) => {
            const el = event.currentTarget;
            const width =
              (el.firstElementChild as HTMLElement | null)?.offsetWidth ?? 1;
            setPage(
              Math.min(count - 1, Math.round(el.scrollLeft / (width + 16))),
            );
          }}
        >
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="shrink-0 snap-center"
              onClick={(event) => event.stopPropagation()}
            >
              <Pass
                group={group}
                ticket={ticket}
                colour={colour}
                qrSize={qrSize}
              />
            </div>
          ))}
        </div>
        {count > 1 && (
          <button
            type="button"
            aria-label="Next pass"
            disabled={page === count - 1}
            onClick={(event) => {
              event.stopPropagation();
              goTo(page + 1);
            }}
            className={arrowButton}
          >
            <ChevronRight className="size-6" />
          </button>
        )}
      </div>
      {count > 1 && (
        <div
          className="flex shrink-0 justify-center gap-1.5 pb-2"
          onClick={(event) => event.stopPropagation()}
        >
          {group.tickets.map((ticket, index) => (
            <button
              key={ticket.id}
              type="button"
              aria-label={`Pass ${index + 1}`}
              onClick={() => goTo(index)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: index === page ? 18 : 6,
                backgroundColor:
                  index === page ? "#00b2ff" : "rgba(255,255,255,0.3)",
              }}
            />
          ))}
        </div>
      )}
      <p className="shrink-0 px-8 pb-4 text-center text-xs text-white/60">
        {past
          ? "This event is over, so there's nothing to scan."
          : "Show this at the door. Turn your screen brightness up if it won't scan."}
      </p>
    </div>,
    document.body,
  );
};
