"use client";

import { constructErrorMessage } from "@/api/functions";
import { postData } from "@/api";
import SectionContainer from "@/components/layouts/section-container/section-container";
import EventDetailSkeleton from "@/components/pages/explore/event-detail/event-detail-skeleton";
import CustomImageComponent from "@/components/ui/custom-image.component";
import ErrorContainer from "@/components/ui/error-container";
import { useEvent } from "@/hooks/use-event";
import { useEventTickets } from "@/hooks/use-ticket.hook";
import { formatCurrency } from "@/lib/functions";
import { eventDayName, formatEventTime } from "@/lib/event-time";
import { describeTicketSaleState, ticketSaleState } from "@/lib/ticket-sales";
import { joinEventChatGroup } from "@/lib/event-chat";
import LeavingTurnupzDialog from "@/components/pages/explore/leaving-turnupz-dialog";
import ExploreBackLink from "@/components/pages/explore/explore-back-link";
import { ROUTES } from "@/lib/variables";
import {
  readArrival,
  readShareRef,
  rememberArrival,
  rememberShareRef,
} from "@/lib/share-ref";
import { getData } from "@/api";
import { useQuery } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import useUserStore from "@/stores/user-store";
import { cn } from "@/lib/utils";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  CalendarRange,
  ExternalLink,
  LockKeyhole,
  MapPin,
  Minus,
  Plus,
  TicketIcon,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  EOrderStatus,
  IEventDetailsType,
  ITicketDetailsType,
} from "@/lib/types";

const EXTERNAL_LINK_TYPE = "EXTERNAL_LINK";

const getTicketPriceLabel = (ticket: ITicketDetailsType) => {
  if (ticket.price?.formatted?.withCurrency) {
    return ticket.price.formatted.withCurrency;
  }
  if (ticket.price?.amount) {
    const { locale, code } = ticket.price.currency;
    return formatCurrency(ticket.price.amount, code, locale);
  }
  return "Free";
};

/** The most of one ticket type a buyer can take: stock, then the organiser's cap. */
const maxFor = (ticket: ITicketDetailsType) => {
  const byStock = ticket.available ?? ticket.quantity ?? 10;
  return Math.max(
    0,
    ticket.maxPerOrder ? Math.min(byStock, ticket.maxPerOrder) : byStock,
  );
};

const TicketSelectionCard: React.FC<{
  ticket: ITicketDetailsType;
  event?: IEventDetailsType;
  selected?: boolean;
  onSelect: () => void;
}> = ({ ticket, event, selected, onSelect }) => {
  const eventDate = event?.date ? new Date(event.date) : null;
  const venue = [
    event?.venue?.name,
    event?.venueName,
    event?.venueAddress,
    event?.eventCity,
    event?.eventState,
    event?.eventCountry,
  ]
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");
  const scanValue = `${event?.id ?? "event"}:${ticket.id}:${ticket.name}`;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full overflow-hidden rounded-[1.4rem] border text-left shadow-[0_18px_45px_rgba(15,23,42,0.10)] transition",
        selected
          ? "border-primary-300 ring-2 ring-primary-100"
          : "border-transparent hover:-translate-y-0.5 hover:border-primary-200",
      )}
    >
      <div className="grid min-h-[11.5rem] bg-[linear-gradient(135deg,#319d91_0%,#1f6d86_54%,#174867_100%)] text-white sm:grid-cols-[minmax(0,1fr)_9rem]">
        <div className="relative flex min-h-[11.5rem] flex-col justify-between overflow-hidden px-5 py-5">
          <div className="absolute inset-0 opacity-[0.08] [background-image:repeating-linear-gradient(45deg,transparent,transparent_10px,#ffffff_10px,#ffffff_11px)]" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="-rotate-20 text-5xl font-black uppercase tracking-[0.16em] text-white/10">
              Turnupz
            </span>
          </div>
          <div className="relative z-10 space-y-4">
            <span className="inline-flex rounded-full bg-white/18 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
              {ticket.name || ticket.type || "Ticket"}
            </span>
            <div>
              <h3 className="text-lg font-black leading-tight">
                {event?.name || "Turnupz Event"}
              </h3>
              <div className="mt-4 space-y-2 text-xs text-white/80">
                <p className="flex items-center gap-2">
                  <CalendarDays className="size-4" />
                  {eventDate
                    ? formatEventTime(eventDate, event?.timezone)
                    : "Date pending"}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="size-4" />
                  {venue || "Venue pending"}
                </p>
              </div>
            </div>
          </div>
          <div className="relative z-10 flex items-center justify-between gap-3">
            <span className="rounded-full bg-white/18 px-4 py-2 text-sm font-semibold">
              {ticket.name || ticket.type || "Ticket"}
            </span>
            <span className="text-xs font-semibold text-white/45">
              {describeTicketSaleState(
                ticketSaleState(ticket),
                event?.timezone,
              ) ?? "turnupz.com"}
            </span>
          </div>
        </div>

        <div className="relative flex min-h-[11.5rem] flex-col items-center justify-center bg-black/12 px-4 py-4">
          <div className="absolute -left-3 top-0 hidden h-full border-l border-dashed border-white/30 sm:block" />
          <div className="absolute -left-3 top-0 hidden size-6 -translate-y-1/2 rounded-full bg-white sm:block" />
          <div className="absolute -left-3 bottom-0 hidden size-6 translate-y-1/2 rounded-full bg-white sm:block" />
          <p className="text-base font-black">{getTicketPriceLabel(ticket)}</p>
          <div className="mt-3 rounded-lg bg-white p-2">
            <QRCodeSVG value={scanValue} size={82} level="M" />
          </div>
          <p className="mt-2 break-all text-center text-[10px] font-medium text-white/58">
            {ticket.id.slice(0, 12).toUpperCase()}
          </p>
        </div>
      </div>
    </button>
  );
};

const TicketPage = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = params?.id?.toString() || "";
  const privateAccessCode =
    searchParams.get("access") ||
    searchParams.get("privateTicket") ||
    searchParams.get("ticketAccess") ||
    "";
  const userDetails = useUserStore((state) => state.userDetails);

  const {
    data: event,
    error: eventError,
    refetch: refetchEvent,
  } = useEvent(eventId, privateAccessCode || undefined);

  const {
    data: ticketsData,
    error: ticketsError,
    refetch: refetchTickets,
  } = useEventTickets(eventId, privateAccessCode || undefined);

  const tickets = useMemo(() => ticketsData?.data || [], [ticketsData]);

  const getEventTicketOption = useCallback(
    (ticket: ITicketDetailsType) => {
      return event?.eventTickets?.find((eventTicket) => {
        const ticketName = ticket.name?.toLowerCase();
        const ticketType = ticket.type?.toLowerCase();
        const categoryName = eventTicket.ticketName?.toLowerCase();
        return categoryName === ticketName || categoryName === ticketType;
      });
    },
    [event?.eventTickets],
  );

  // A multi-day event's tickets say which days they get in on.
  const ticketDaysNote = useCallback(
    (ticket: ITicketDetailsType) => {
      const days = event?.days ?? [];
      if (days.length < 2) return null;
      const dayIds =
        event?.eventTickets?.find((option) => option.id === ticket.id)
          ?.dayIds ?? [];
      const covered = dayIds.length
        ? days.filter((day) => dayIds.includes(day.id))
        : days;
      if (covered.length === days.length)
        return `Every day · ${days.length} days`;
      return covered
        .map((day) => eventDayName(day, event?.timezone))
        .join(", ");
    },
    [event?.days, event?.eventTickets, event?.timezone],
  );

  const getTicketVisibility = useCallback(
    (ticket: ITicketDetailsType) => {
      return (
        ticket.visibility ||
        getEventTicketOption(ticket)?.visibility ||
        "public"
      );
    },
    [getEventTicketOption],
  );

  const getTicketAccessCode = useCallback(
    (ticket: ITicketDetailsType) => {
      return (
        ticket.privateAccessCode ||
        ticket.accessCode ||
        ticket.privateToken ||
        getEventTicketOption(ticket)?.privateAccessCode ||
        ""
      );
    },
    [getEventTicketOption],
  );

  const accessibleTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (getTicketVisibility(ticket) !== "private") {
        return true;
      }

      const accessCode = getTicketAccessCode(ticket);
      return !!privateAccessCode && accessCode === privateAccessCode;
    });
  }, [getTicketAccessCode, getTicketVisibility, privateAccessCode, tickets]);

  const hiddenPrivateTicketCount = useMemo(() => {
    return tickets.filter((ticket) => getTicketVisibility(ticket) === "private")
      .length;
  }, [getTicketVisibility, tickets]);

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showRegistrationTypes, setShowRegistrationTypes] = useState(false);

  const selectedTicket = useMemo(
    () => accessibleTickets.find((t) => t.id === selectedTicketId) ?? null,
    [accessibleTickets, selectedTicketId],
  );

  // Outside tickets aren't listed; their link shows only when nothing else is sold here.
  const isExternalTicket =
    selectedTicket?.type === EXTERNAL_LINK_TYPE &&
    accessibleTickets.every((ticket) => ticket.type === EXTERNAL_LINK_TYPE);
  const isRegistrationOnly = event?.saleMethod === "register";
  const registrationTickets = useMemo(
    () =>
      accessibleTickets.filter((ticket) => ticket.type !== EXTERNAL_LINK_TYPE),
    [accessibleTickets],
  );

  const externalLinkHost = useMemo(() => {
    if (!isExternalTicket || !selectedTicket?.link) return null;
    try {
      const url = new URL(selectedTicket.link);
      // Only proper web links; anything else is treated as broken.
      if (url.protocol !== "https:" && url.protocol !== "http:") return null;
      return url.hostname.replace(/^www\./, "");
    } catch {
      return null;
    }
  }, [isExternalTicket, selectedTicket]);

  // Tell them they're leaving Turnupz before the seller's site opens.
  const [confirmLeaving, setConfirmLeaving] = useState(false);

  const handleOpenExternalLink = useCallback(() => {
    setConfirmLeaving(false);
    if (!selectedTicket?.link || !externalLinkHost) {
      toast.error("No purchase link is available for this ticket");
      return;
    }
    if (event && userDetails) {
      joinEventChatGroup({
        event,
        user: userDetails,
        joinReason: "external",
      });
    }
    window.open(selectedTicket.link, "_blank", "noopener,noreferrer");
  }, [event, externalLinkHost, selectedTicket, userDetails]);

  // Tickets (not registration): any mix of ticket types, each with its own count.
  const [counts, setCounts] = useState<Record<string, number>>({});
  const buyableTickets = useMemo(
    () =>
      accessibleTickets.filter((ticket) => ticket.type !== EXTERNAL_LINK_TYPE),
    [accessibleTickets],
  );
  const lines = useMemo(
    () =>
      buyableTickets
        .filter((ticket) => (counts[ticket.id] ?? 0) > 0)
        .map((ticket) => ({ ticket, quantity: counts[ticket.id] })),
    [buyableTickets, counts],
  );
  /** The ticket whose currency prices the order. */
  const pricingTicket = isRegistrationOnly
    ? selectedTicket
    : (lines[0]?.ticket ?? null);
  const linesOnSale =
    lines.length > 0 &&
    lines.every((line) => ticketSaleState(line.ticket).status === "open");

  const totalPrice = useMemo(
    () =>
      isRegistrationOnly
        ? (selectedTicket?.price?.amount ?? 0) * quantity
        : lines.reduce(
            (sum, line) =>
              sum + (line.ticket.price?.amount ?? 0) * line.quantity,
            0,
          ),
    [isRegistrationOnly, selectedTicket, quantity, lines],
  );

  const formattedTotalPrice = useMemo(() => {
    if (!pricingTicket) return null;
    const { locale, code } = pricingTicket.price.currency;
    return formatCurrency(totalPrice, code, locale);
  }, [pricingTicket, totalPrice]);

  // Turnupz Credit in the ticket's currency, spent first when switched on.
  const { data: creditRows } = useQuery({
    queryKey: ["credit", "balance"],
    enabled: !!userDetails,
    queryFn: async () =>
      (
        await getData<{ currency: string; available: { amount: number } }[]>(
          "/credit",
        )
      ).data?.data ?? [],
  });
  const [useCredit, setUseCredit] = useState(true);

  // The organiser's promo code: checked with the api, taken off each paid ticket
  // (never more than 90%). The api works out the exact amount when you pay.
  const [promoInput, setPromoInput] = useState("");
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoChecking, setPromoChecking] = useState(false);
  const [promo, setPromo] = useState<{
    code: string;
    label: string;
    discountPercent: number | null;
    discountAmount: { amount: number } | null;
  } | null>(null);
  const applyPromo = useCallback(
    async (raw: string, quiet = false) => {
      const code = raw.trim().toUpperCase();
      if (!code) return;
      setPromoChecking(true);
      try {
        const { data } = await getData<{
          code: string;
          label: string;
          discountPercent: number | null;
          discountAmount: { amount: number } | null;
        }>(
          `/promo-codes/check?eventId=${eventId}&code=${encodeURIComponent(code)}`,
        );
        if (data?.data) {
          setPromo(data.data);
          setPromoInput(data.data.code);
          setPromoOpen(true);
          if (!quiet) toast.success(`${data.data.code} applied`);
        }
      } catch (error) {
        if (!quiet) {
          toast.error(
            constructErrorMessage(
              error as TApiErrorResponseType,
              "That code doesn't work for this event.",
            ),
          );
        }
      } finally {
        setPromoChecking(false);
      }
    },
    [eventId],
  );
  // A promoter's link (?code=…) fills the code in for them.
  const codeFromLink = searchParams?.get("code");
  useEffect(() => {
    rememberArrival(eventId, {
      src: searchParams?.get("src"),
      code: codeFromLink,
    });
    const code = codeFromLink ?? readArrival(eventId).code;
    if (code && userDetails) void applyPromo(code, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, codeFromLink, !!userDetails]);
  const promoDiscount = useMemo(() => {
    if (!promo || isRegistrationOnly) return 0;
    return lines.reduce((sum, line) => {
      const price = line.ticket.price?.amount ?? 0;
      if (price <= 0) return sum;
      const most = Math.floor(price * 0.9);
      const off = promo.discountPercent
        ? Math.min(Math.round((price * promo.discountPercent) / 100), most)
        : Math.min(promo.discountAmount?.amount ?? 0, most);
      return sum + off * line.quantity;
    }, 0);
  }, [isRegistrationOnly, lines, promo]);
  const afterPromo = Math.max(totalPrice - promoDiscount, 0);
  const creditAvailable =
    creditRows?.find(
      (row) =>
        row.currency.toUpperCase() ===
        pricingTicket?.price?.currency?.code?.toUpperCase(),
    )?.available?.amount ?? 0;
  const creditApplied =
    useCredit && afterPromo > 0 ? Math.min(creditAvailable, afterPromo) : 0;
  const toPay = Math.max(afterPromo - creditApplied, 0);
  const money = useCallback(
    (amount: number) =>
      pricingTicket
        ? formatCurrency(
            amount,
            pricingTicket.price.currency.code,
            pricingTicket.price.currency.locale,
          )
        : "",
    [pricingTicket],
  );

  // Whose link they came through, for share-link credit.
  const refFromUrl = searchParams?.get("ref");
  useEffect(() => {
    rememberShareRef(eventId, refFromUrl);
  }, [eventId, refFromUrl]);

  useEffect(() => {
    if (
      accessibleTickets.length > 0 &&
      (!selectedTicketId ||
        !accessibleTickets.some((ticket) => ticket.id === selectedTicketId))
    ) {
      setSelectedTicketId(accessibleTickets[0].id);
    }
  }, [accessibleTickets, selectedTicketId]);

  // Start with one of the first ticket on sale, so the summary isn't empty.
  const [startedWithOne, setStartedWithOne] = useState(false);
  useEffect(() => {
    if (startedWithOne || isRegistrationOnly) return;
    const first = buyableTickets.find(
      (ticket) =>
        ticketSaleState(ticket).status === "open" && maxFor(ticket) > 0,
    );
    if (first) {
      setCounts({ [first.id]: 1 });
      setStartedWithOne(true);
    }
  }, [startedWithOne, isRegistrationOnly, buyableTickets]);

  /** Sets how many of one ticket type; another currency starts the order afresh. */
  const setCount = useCallback(
    (ticket: ITicketDetailsType, count: number) => {
      const next = Math.max(0, Math.min(count, maxFor(ticket)));
      setCounts((current) => {
        const currency = buyableTickets
          .find((t) => (current[t.id] ?? 0) > 0)
          ?.price?.currency?.code?.toUpperCase();
        const base =
          currency && ticket.price?.currency?.code?.toUpperCase() !== currency
            ? {}
            : { ...current };
        if (next > 0) base[ticket.id] = next;
        else delete base[ticket.id];
        return base;
      });
    },
    [buyableTickets],
  );

  const handleSelectTicket = useCallback((ticketId: string) => {
    setSelectedTicketId(ticketId);
    setQuantity(1);
  }, []);

  const handleDecrement = useCallback(() => {
    setQuantity((prev) => Math.max(1, prev - 1));
  }, []);

  const selectedSaleState = useMemo(
    () => ticketSaleState(selectedTicket),
    [selectedTicket],
  );
  const selectedSaleNotice = describeTicketSaleState(
    selectedSaleState,
    event?.timezone,
  );
  const isSelectedOnSale = selectedSaleState.status === "open";

  const maxQuantity = useMemo(() => {
    const byStock = isRegistrationOnly
      ? Math.max(
          Math.min(
            event?.remainingRegistrationSpots ?? 1,
            selectedTicket?.available ?? selectedTicket?.quantity ?? 1,
          ),
          1,
        )
      : (selectedTicket?.available ?? selectedTicket?.quantity ?? 10);
    // The organiser can cap how many one buyer takes in a single order.
    return selectedTicket?.maxPerOrder
      ? Math.max(1, Math.min(byStock, selectedTicket.maxPerOrder))
      : byStock;
  }, [event?.remainingRegistrationSpots, isRegistrationOnly, selectedTicket]);

  const saleNoticeBlock = selectedTicket &&
    (selectedSaleNotice || selectedTicket.maxPerOrder) && (
      <p
        className={cn(
          "text-sm",
          selectedSaleNotice
            ? "rounded-lg bg-secondary-50 px-3 py-2 font-medium text-secondary-800"
            : "text-right text-muted-foreground",
        )}
      >
        {selectedSaleNotice ?? `Up to ${selectedTicket.maxPerOrder} per order`}
      </p>
    );

  const handleIncrement = useCallback(() => {
    setQuantity((prev) => Math.min(maxQuantity, prev + 1));
  }, [maxQuantity]);

  const handlePurchase = useCallback(async () => {
    if (!userDetails) {
      toast.error(
        isRegistrationOnly
          ? "Please log in to register for this event"
          : "Please log in to purchase tickets",
      );
      const redirect = encodeURIComponent(
        `${window.location.pathname}${window.location.search}`,
      );
      router.push(`${ROUTES.LOGIN.href}?redirect=${redirect}`);
      return;
    }

    if (isRegistrationOnly) {
      if (event?.registrationStatus !== "open") {
        toast.error(
          event?.registrationStatus === "full"
            ? "Event registration is full"
            : "Registration is closed",
        );
        return;
      }

      setIsPurchasing(true);
      try {
        const attendeeName =
          userDetails.name ||
          [userDetails.firstName, userDetails.lastName]
            .filter(Boolean)
            .join(" ") ||
          "Turnupz attendee";
        const attendeeEmail = userDetails.email || "";
        const { data } = await postData<
          {
            ticketId?: string;
            quantity: number;
            attendeeName: string;
            attendeeEmail: string;
            privateAccessCode?: string;
          },
          {
            registrationId: string;
            status: "confirmed" | "pending";
            ticketCode?: string;
            qrCodeValue?: string;
            barcodeValue?: string;
          }
        >(`/event/${eventId}/register`, {
          ticketId: selectedTicket?.id,
          quantity,
          attendeeName,
          attendeeEmail,
          privateAccessCode:
            selectedTicket && getTicketVisibility(selectedTicket) === "private"
              ? privateAccessCode
              : undefined,
        });

        if (event) {
          joinEventChatGroup({
            event,
            user: userDetails,
            joinReason: "registered",
          });
        }

        if (data.data.status === "pending") {
          toast.success("Registration submitted and pending approval.");
        } else {
          toast.success(
            "Registration confirmed. Your ticket is available in your account.",
          );
        }
        router.push(ROUTES.PROFILE_TICKETS.href);
      } catch (error) {
        toast.error(
          constructErrorMessage(
            error as TApiErrorResponseType,
            "Failed to register. Please try again.",
          ),
        );
      } finally {
        setIsPurchasing(false);
      }
      return;
    }

    if (!lines.length) {
      toast.error("Pick at least one ticket");
      return;
    }

    setIsPurchasing(true);
    try {
      const isPrivate = lines.some(
        (line) => getTicketVisibility(line.ticket) === "private",
      );
      const { data } = await postData<
        {
          ticketId?: string;
          quantity?: number;
          items?: { ticketId: string; quantity: number }[];
          callbackUrl: string;
          privateAccessCode?: string;
          useCredit?: boolean;
          ref?: string;
          promoCode?: string;
          source?: string;
        },
        { orderId: string; status: EOrderStatus; redirectUrl?: string }
      >("/order", {
        // One ticket type keeps the original request; several go as items.
        ...(lines.length === 1
          ? { ticketId: lines[0].ticket.id, quantity: lines[0].quantity }
          : {
              items: lines.map((line) => ({
                ticketId: line.ticket.id,
                quantity: line.quantity,
              })),
            }),
        privateAccessCode: isPrivate ? privateAccessCode : undefined,
        callbackUrl: `${window.location.origin}${ROUTES.PROFILE_ORDERS.href}/{{orderId}}/success`,
        ...(creditApplied > 0 ? { useCredit: true } : {}),
        ref: readShareRef(eventId),
        ...(promo ? { promoCode: promo.code } : {}),
        ...(readArrival(eventId).src
          ? { source: readArrival(eventId).src }
          : {}),
      });
      const redirectUrl = data?.data?.redirectUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }
      toast.success(
        lines.reduce((sum, line) => sum + line.quantity, 0) > 1
          ? "Your tickets are ready"
          : "Your ticket is ready",
      );
      router.push(
        `${ROUTES.PROFILE_ORDERS.href}/${data?.data?.orderId}/success`,
      );
    } catch (error) {
      toast.error(
        constructErrorMessage(
          error as TApiErrorResponseType,
          "Failed to purchase ticket. Please try again.",
        ),
      );
    } finally {
      setIsPurchasing(false);
    }
  }, [
    promo,
    userDetails,
    isRegistrationOnly,
    eventId,
    selectedTicket,
    quantity,
    lines,
    router,
    event,
    getTicketVisibility,
    privateAccessCode,
    creditApplied,
  ]);

  const error = eventError || ticketsError;
  const isLoading = !event && !eventError;

  if (isLoading) return <EventDetailSkeleton />;

  if (error)
    return (
      <SectionContainer className="space-y-14 py-14 min-h-[500px] h-screen flex items-center justify-center">
        <ErrorContainer
          error={constructErrorMessage(
            error as TApiErrorResponseType,
            "Unable to load ticket information",
          )}
          retryFunction={() => {
            refetchEvent();
            refetchTickets();
          }}
        />
      </SectionContainer>
    );

  return (
    <SectionContainer className="py-10 space-y-10 max-w-3xl">
      <ExploreBackLink
        href={`${ROUTES.EXPLORE.href}/event/${eventId}`}
        label="Back to event"
      />

      <div className="w-full aspect-video relative bg-black/5 rounded-2xl overflow-hidden max-h-[300px] border">
        <CustomImageComponent
          src={event?.image || ""}
          alt={event?.name || "Event"}
          fill
          className="size-full"
          imageClassName="object-cover"
        />
      </div>

      <div className="space-y-8">
        <h2 className="text-2xl font-bold">Choose Ticket</h2>

        {isRegistrationOnly && (
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => setShowRegistrationTypes((current) => !current)}
              className="w-full rounded-2xl border border-primary-100 bg-primary-50/70 p-5 text-left transition hover:border-primary-200 hover:bg-primary-50"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-700">
                Registration
              </p>
              <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-secondary-950">
                    Register for {event?.name}
                  </h3>
                  <div className="mt-4 grid gap-3 text-sm text-secondary-600 sm:grid-cols-2">
                    <p>
                      <span className="font-semibold text-secondary-950">
                        Registered:
                      </span>{" "}
                      {(event?.registrationCount ?? 0).toLocaleString()}
                    </p>
                    <p>
                      <span className="font-semibold text-secondary-950">
                        Spots left:
                      </span>{" "}
                      {(
                        event?.remainingRegistrationSpots ?? 0
                      ).toLocaleString()}
                    </p>
                    <p>
                      <span className="font-semibold text-secondary-950">
                        Limit:
                      </span>{" "}
                      {(
                        event?.registrationLimit ??
                        event?.totalTickets ??
                        0
                      ).toLocaleString()}
                    </p>
                    <p className="capitalize">
                      <span className="font-semibold text-secondary-950">
                        Status:
                      </span>{" "}
                      {event?.registrationStatus ?? "open"}
                    </p>
                  </div>
                </div>
                <span className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-primary-500 px-4 text-sm font-semibold text-white">
                  {showRegistrationTypes ? "Hide Types" : "Choose Type"}
                </span>
              </div>
              {event?.requiresApproval && (
                <p className="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-secondary-600">
                  This event requires organizer approval. Your registration will
                  be marked pending until approved.
                </p>
              )}
            </button>

            {showRegistrationTypes && registrationTickets.length > 0 && (
              <div className="space-y-4">
                <div>
                  <p className="text-lg font-semibold text-secondary-950">
                    Choose registration type
                  </p>
                  <p className="mt-1 text-sm text-secondary-500">
                    Select the registration category you want. Private
                    categories only appear when you open the organizer&apos;s
                    invite link.
                  </p>
                </div>
                <div className="space-y-4">
                  {registrationTickets.map((ticket) => (
                    <TicketSelectionCard
                      key={ticket.id}
                      ticket={ticket}
                      event={event}
                      selected={selectedTicketId === ticket.id}
                      onSelect={() => handleSelectTicket(ticket.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {showRegistrationTypes &&
              tickets.length > 0 &&
              registrationTickets.length === 0 && (
                <div className="rounded-2xl border border-secondary-200 bg-secondary-50 p-5 text-secondary-900">
                  <div className="flex items-start gap-3">
                    <LockKeyhole className="mt-0.5 size-5 shrink-0" />
                    <div>
                      <p className="font-semibold">
                        No public registration type available
                      </p>
                      <p className="mt-1 text-sm leading-6">
                        Private registration categories are hidden unless you
                        open the organizer&apos;s invite link.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            <div className="space-y-4 border rounded-xl p-6">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-lg">Number of Registrations</p>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    className="size-9 rounded-full border border-border flex items-center justify-center transition-colors hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="text-lg font-semibold w-8 text-center tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={quantity >= maxQuantity}
                    aria-label="Increase quantity"
                    className="size-9 rounded-full bg-primary-500 text-white flex items-center justify-center transition-colors hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>
              {saleNoticeBlock}
            </div>

            <button
              onClick={handlePurchase}
              disabled={
                isPurchasing ||
                event?.registrationStatus !== "open" ||
                (registrationTickets.length > 0 && !selectedTicket) ||
                (!!selectedTicket && !isSelectedOnSale)
              }
              className="w-full h-14 text-lg font-semibold rounded-2xl bg-linear-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              {isPurchasing && "Registering..."}
              {!isPurchasing && "Register for free"}
            </button>
          </div>
        )}

        {!isRegistrationOnly &&
          tickets.length > 0 &&
          accessibleTickets.length === 0 && (
            <div className="rounded-2xl border border-secondary-200 bg-secondary-50 p-5 text-secondary-900">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 size-5 shrink-0" />
                <div>
                  <p className="font-semibold">No public tickets available</p>
                  <p className="mt-1 text-sm leading-6">
                    Private ticket categories are hidden unless you open the
                    organizer&apos;s invite link.
                  </p>
                </div>
              </div>
            </div>
          )}

        {!isRegistrationOnly &&
          accessibleTickets.length > 0 &&
          hiddenPrivateTicketCount > 0 && (
            <div className="rounded-2xl border border-primary-100 bg-primary-50/60 p-4 text-sm text-primary-900">
              {privateAccessCode
                ? "Private ticket access applied. Only matching private categories are shown."
                : "Some ticket categories are private and only appear through an organizer invite link."}
            </div>
          )}

        {!isRegistrationOnly && tickets.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <TicketIcon className="size-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">No tickets available</p>
            <p className="text-sm mt-1">
              Tickets for this event are not yet on sale.
            </p>
          </div>
        )}

        {!isRegistrationOnly && accessibleTickets.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {accessibleTickets
                ?.filter((ticket) => ticket?.type !== EXTERNAL_LINK_TYPE)
                .map((ticket) => {
                  const count = counts[ticket.id] ?? 0;
                  const isSelected = count > 0;
                  const max = maxFor(ticket);
                  const saleNote = describeTicketSaleState(
                    ticketSaleState(ticket),
                    event?.timezone,
                  );
                  const unavailable = !!saleNote || max === 0;
                  const borderColor = isSelected
                    ? "border-primary-800 dark:border-primary-600"
                    : "border-border group-hover:border-primary-400";
                  return (
                    <div
                      key={ticket.id}
                      role="button"
                      tabIndex={unavailable ? -1 : 0}
                      aria-disabled={unavailable}
                      onClick={() =>
                        !unavailable && !isSelected && setCount(ticket, 1)
                      }
                      onKeyDown={(e) => {
                        if (
                          (e.key === "Enter" || e.key === " ") &&
                          !unavailable &&
                          !isSelected
                        ) {
                          e.preventDefault();
                          setCount(ticket, 1);
                        }
                      }}
                      className={cn(
                        "text-left flex flex-col group transition-all",
                        unavailable
                          ? "cursor-not-allowed opacity-55"
                          : "cursor-pointer",
                      )}
                    >
                      <div
                        className={cn(
                          "border-2 border-dashed border-b-0 rounded-t-xl px-5 pt-5 pb-6 flex-1 flex flex-col gap-3",
                          borderColor,
                          isSelected &&
                            "bg-primary-50/30 dark:bg-primary-950/20",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="size-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <TicketIcon className="size-6 text-primary-700 dark:text-primary-400" />
                          </div>
                          {max === 0 && !saleNote ? (
                            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">
                              Sold out
                            </span>
                          ) : (
                            ticket.available != null &&
                            !saleNote && (
                              <span
                                className={cn(
                                  "rounded-full px-2.5 py-1 text-xs font-bold",
                                  ticket.available <= 20
                                    ? "bg-orange-50 text-orange-700"
                                    : "bg-secondary-100 text-secondary-600",
                                )}
                              >
                                {ticket.available.toLocaleString()} left
                              </span>
                            )
                          )}
                        </div>
                        <p className="font-bold text-lg">{ticket.name}</p>
                        {ticketDaysNote(ticket) && (
                          <p className="-mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary-700">
                            <CalendarRange
                              className="size-3.5 shrink-0"
                              aria-hidden
                            />
                            {ticketDaysNote(ticket)}
                          </p>
                        )}
                        {saleNote && (
                          <p className="-mt-2 text-xs font-medium text-secondary-700">
                            {saleNote}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center">
                        <div
                          className={cn(
                            "w-3 h-6 rounded-r-full border-2 border-l-0 border-dashed shrink-0 bg-background",
                            borderColor,
                          )}
                        />
                        <div
                          className={cn(
                            "flex-1 border-t-2 border-dashed",
                            borderColor,
                          )}
                        />
                        <div
                          className={cn(
                            "w-3 h-6 rounded-l-full border-2 border-r-0 border-dashed shrink-0 bg-background",
                            borderColor,
                          )}
                        />
                      </div>

                      <div
                        className={cn(
                          "border-2 border-t-0 border-dashed rounded-b-xl px-5 pt-4 pb-5",
                          borderColor,
                          isSelected &&
                            "bg-primary-50/30 dark:bg-primary-950/20",
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                          <p className="font-semibold">
                            <span className="text-primary-700 dark:text-primary-400 font-bold text-base">
                              {ticket?.price?.amount > 0 &&
                                ticket?.price?.formatted?.withCurrency}
                              {!ticket?.price?.amount && "Free"}
                            </span>
                            {ticket?.price?.amount > 0 && (
                              <span className="text-muted-foreground font-normal text-sm">
                                {" "}
                                / person
                              </span>
                            )}
                          </p>
                          {isSelected ? (
                            <div
                              className="flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => setCount(ticket, count - 1)}
                                aria-label={
                                  count === 1
                                    ? `Remove ${ticket.name}`
                                    : `One less ${ticket.name}`
                                }
                                className="size-8 rounded-full border border-border flex items-center justify-center transition-colors hover:bg-accent cursor-pointer"
                              >
                                <Minus className="size-4" />
                              </button>
                              <span className="w-6 text-center font-semibold tabular-nums">
                                {count}
                              </span>
                              <button
                                type="button"
                                onClick={() => setCount(ticket, count + 1)}
                                disabled={count >= max}
                                aria-label={`One more ${ticket.name}`}
                                className="size-8 rounded-full bg-primary-500 text-white flex items-center justify-center transition-colors hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                              >
                                <Plus className="size-4" />
                              </button>
                            </div>
                          ) : (
                            !unavailable && (
                              <span className="text-sm font-bold text-primary-700">
                                Add
                              </span>
                            )
                          )}
                        </div>
                        {isSelected && count >= max && max > 0 && (
                          <p className="mt-3 rounded-lg bg-primary-50 px-3 py-2 text-xs text-secondary-700">
                            {max === ticket.available
                              ? `That's all that's left. You've got the last ${max === 1 ? "one" : max}.`
                              : `You can get up to ${max} in one order, so others get a chance too.`}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {isExternalTicket ? (
              <div className="space-y-4 border rounded-xl p-6 bg-primary-50/30 dark:bg-primary-950/10">
                <div className="flex items-start gap-3">
                  <ExternalLink className="size-5 text-primary-700 dark:text-primary-400 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-semibold">
                      This ticket is sold externally
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Purchases for this ticket are handled outside Turnupz.
                      Click the button below to be redirected to the
                      organizer&apos;s site to complete your purchase.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 border rounded-xl p-6">
                {lines.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Pick the tickets you want above. You can mix ticket types.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {lines.map((line) => (
                      <div
                        key={line.ticket.id}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <p className="text-muted-foreground">
                          {line.quantity} × {line.ticket.name}
                        </p>
                        <p className="font-semibold">
                          {line.ticket.price?.amount
                            ? formatCurrency(
                                line.ticket.price.amount * line.quantity,
                                line.ticket.price.currency.code,
                                line.ticket.price.currency.locale,
                              )
                            : "Free"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t" />

                {totalPrice > 0 &&
                  !!userDetails &&
                  (promo ? (
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <p className="text-muted-foreground">
                        <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-mono text-xs font-bold text-emerald-700">
                          {promo.code}
                        </span>{" "}
                        {promo.label}
                        <button
                          type="button"
                          onClick={() => {
                            setPromo(null);
                            setPromoInput("");
                          }}
                          className="ml-2 text-xs font-semibold underline"
                        >
                          Remove
                        </button>
                      </p>
                      {promoDiscount > 0 && (
                        <p className="font-semibold text-emerald-700">
                          −{money(promoDiscount)}
                        </p>
                      )}
                    </div>
                  ) : promoOpen ? (
                    <form
                      className="flex gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void applyPromo(promoInput);
                      }}
                    >
                      <input
                        value={promoInput}
                        onChange={(event) =>
                          setPromoInput(event.target.value.toUpperCase())
                        }
                        placeholder="Promo code"
                        aria-label="Promo code"
                        maxLength={20}
                        className="h-10 min-w-0 flex-1 rounded-xl border px-3 font-mono text-sm uppercase"
                      />
                      <button
                        type="submit"
                        disabled={!promoInput.trim() || promoChecking}
                        className="h-10 rounded-xl bg-secondary-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {promoChecking ? "Checking…" : "Apply"}
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPromoOpen(true)}
                      className="text-left text-sm font-semibold text-secondary-700 underline-offset-4 hover:underline"
                    >
                      Have a promo code?
                    </button>
                  ))}

                {totalPrice > 0 && !!userDetails && (
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 p-3">
                    <div>
                      <p className="text-sm font-semibold">
                        Use Turnupz Credit
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {creditAvailable > 0
                          ? `${money(creditAvailable)} available`
                          : `${money(0)} available`}
                      </p>
                    </div>
                    <Switch
                      disabled={creditAvailable <= 0}
                      checked={useCredit && creditAvailable > 0}
                      onCheckedChange={setUseCredit}
                      aria-label="Use Turnupz Credit"
                    />
                  </div>
                )}
                {creditApplied > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-muted-foreground">Turnupz Credit</p>
                    <p className="font-semibold">−{money(creditApplied)}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="font-semibold text-lg">
                    {creditApplied > 0 || promoDiscount > 0
                      ? "To pay:"
                      : "Total Price:"}
                  </p>
                  <p className="text-xl font-bold text-primary-600">
                    {totalPrice > 0 &&
                      (creditApplied > 0 || promoDiscount > 0
                        ? toPay > 0
                          ? money(toPay)
                          : "Covered by credit"
                        : formattedTotalPrice)}
                    {lines.length > 0 && totalPrice <= 0 && "Free"}
                  </p>
                </div>
              </div>
            )}

            {isExternalTicket ? (
              <button
                onClick={() => setConfirmLeaving(true)}
                disabled={!selectedTicket?.link}
                className="w-full h-14 text-lg font-semibold rounded-2xl bg-linear-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink className="size-5" />
                {externalLinkHost
                  ? `Proceed to ${externalLinkHost}`
                  : "Proceed to external site"}
              </button>
            ) : (
              <button
                onClick={handlePurchase}
                disabled={!lines.length || isPurchasing || !linesOnSale}
                className="w-full h-14 text-lg font-semibold rounded-2xl bg-linear-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                {isPurchasing && "Processing..."}
                {!isPurchasing &&
                  (lines.length === 0 || linesOnSale
                    ? "Continue"
                    : "Not on sale")}
              </button>
            )}
          </>
        )}
      </div>
      <LeavingTurnupzDialog
        open={confirmLeaving}
        host={externalLinkHost}
        eventName={event?.name}
        onContinue={handleOpenExternalLink}
        onClose={() => setConfirmLeaving(false)}
      />
    </SectionContainer>
  );
};

export default memo(TicketPage);
