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
import { eventDayName } from "@/lib/event-time";
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
import { toast } from "@/lib/toast";
import {
  CalendarRange,
  ExternalLink,
  LockKeyhole,
  Minus,
  Plus,
  TicketIcon,
} from "lucide-react";
import {
  EOrderStatus,
  ITicketDetailsType,
} from "@/lib/types";
import { useFeatures } from "@/hooks/use-features";
import { useEventTaxRates } from "@/hooks/use-tax";
import { checkoutTax } from "@/lib/checkout-tax";

const EXTERNAL_LINK_TYPE = "EXTERNAL_LINK";


/** The most of one ticket type a buyer can take: stock, then the organiser's cap. */
const maxFor = (ticket: ITicketDetailsType) => {
  const byStock = ticket.available ?? ticket.quantity ?? 10;
  return Math.max(
    0,
    ticket.maxPerOrder ? Math.min(byStock, ticket.maxPerOrder) : byStock,
  );
};

/** One registration type to choose. No ticket design yet: they don't have a ticket. */
const RegistrationTypeRow: React.FC<{
  ticket: ITicketDetailsType;
  selected?: boolean;
  onSelect: () => void;
}> = ({ ticket, selected, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={!!selected}
    className={cn(
      "flex w-full items-center justify-between gap-4 rounded-2xl border-2 p-5 text-left transition-colors",
      selected
        ? "border-primary-500 bg-primary-50/50"
        : "border-border hover:border-primary-300",
    )}
  >
    <span className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-primary-500" : "border-secondary-200",
        )}
      >
        {selected && <span className="size-2.5 rounded-full bg-primary-500" />}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold text-secondary-950">{ticket.name}</span>
        {typeof ticket.available === "number" && ticket.available > 0 && (
          <span className="block text-sm text-secondary-500">
            {ticket.available.toLocaleString()} {ticket.available === 1 ? "place" : "places"} left
          </span>
        )}
      </span>
    </span>
    <span className="shrink-0 font-bold text-primary-600">Free</span>
  </button>
);

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
  // Registration is one place per person; tickets have their own counts.
  const quantity = 1;
  const [isPurchasing, setIsPurchasing] = useState(false);

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
  // Counts the ticket page being opened, for the sales funnel. Never gets in the way.
  useEffect(() => {
    if (eventId) void postData(`/event/${eventId}/view`, { page: "tickets" }).catch(() => undefined);
  }, [eventId]);
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
  // Paying with credit can be paused for everyone (Admin switch).
  const { creditSpending } = useFeatures();
  // Tax on the tickets, if any applies here. The api works it out again when paying.
  const { data: taxRates } = useEventTaxRates(
    !isRegistrationOnly && totalPrice > 0 ? eventId : undefined,
    pricingTicket?.price?.currency?.code,
  );
  const taxed = checkoutTax(afterPromo, taxRates);
  const creditApplied =
    creditSpending && useCredit && taxed.gross > 0
      ? Math.min(creditAvailable, taxed.gross)
      : 0;
  const toPay = Math.max(taxed.gross - creditApplied, 0);
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
        <h2 className="text-2xl font-bold">
          {isRegistrationOnly ? "Register" : "Choose Ticket"}
        </h2>

        {isRegistrationOnly && (
          <div className="space-y-6">
            {event?.requiresApproval && (
              <p className="rounded-xl border border-primary-100 bg-primary-50/70 px-4 py-3 text-sm text-secondary-600">
                This event requires organiser approval. Your registration will
                be marked pending until approved.
              </p>
            )}

            {registrationTickets.length > 0 && (
              <div className="space-y-4">
                {registrationTickets.length > 1 && (
                  <p className="text-lg font-semibold text-secondary-950">
                    Choose registration type
                  </p>
                )}
                <div className="space-y-4">
                  {registrationTickets.map((ticket) => (
                    <RegistrationTypeRow
                      key={ticket.id}
                      ticket={ticket}
                      selected={selectedTicketId === ticket.id}
                      onSelect={() => handleSelectTicket(ticket.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {tickets.length > 0 &&
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

            {selectedTicket && (
              <div className="space-y-3 rounded-xl border p-6">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <p className="text-muted-foreground">1 × {selectedTicket.name}</p>
                  <p className="font-semibold">Free</p>
                </div>
                <div className="border-t" />
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold">Total</p>
                  <p className="text-xl font-bold text-primary-600">Free</p>
                </div>
                {saleNoticeBlock}
              </div>
            )}

            {event?.registrationStatus && event.registrationStatus !== "open" && (
              <p className="text-center text-sm font-medium text-secondary-600">
                {event.registrationStatus === "full"
                  ? "This event's registration is full."
                  : "Registration for this event has closed."}
              </p>
            )}

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

                {totalPrice > 0 && !!userDetails && creditSpending && (
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
                {taxed.lines.map((line) => (
                  <div key={line.code} className="flex items-center justify-between text-sm">
                    <p className="text-muted-foreground">
                      {taxed.included ? `Includes ${line.label}` : line.label}
                    </p>
                    <p className="font-semibold">{money(line.amount)}</p>
                  </div>
                ))}
                {creditApplied > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-muted-foreground">Turnupz Credit</p>
                    <p className="font-semibold">−{money(creditApplied)}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="font-semibold text-lg">
                    {creditApplied > 0 || promoDiscount > 0 || toPay !== totalPrice
                      ? "To pay:"
                      : "Total Price:"}
                  </p>
                  <p className="text-xl font-bold text-primary-600">
                    {totalPrice > 0 &&
                      (creditApplied > 0 || promoDiscount > 0 || toPay !== totalPrice
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
