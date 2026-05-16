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
import { joinEventChatGroup } from "@/lib/event-chat";
import { ROUTES } from "@/lib/variables";
import useUserStore from "@/stores/user-store";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  LockKeyhole,
  MapPin,
  Minus,
  Plus,
  TicketIcon,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { EOrderStatus, IEventDetailsType, ITicketDetailsType } from "@/lib/types";

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
          ? "border-cyan-300 ring-2 ring-cyan-100"
          : "border-transparent hover:-translate-y-0.5 hover:border-cyan-200",
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
                  {eventDate ? format(eventDate, "dd/MM/yyyy, hh:mm a") : "Date pending"}
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
            <span className="text-xs font-semibold text-white/45">turnupz.com</span>
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
  } = useEvent(eventId);

  const {
    data: ticketsData,
    error: ticketsError,
    refetch: refetchTickets,
  } = useEventTickets(eventId);

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

  const getTicketVisibility = useCallback(
    (ticket: ITicketDetailsType) => {
      return ticket.visibility || getEventTicketOption(ticket)?.visibility || "public";
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
  }, [
    getTicketAccessCode,
    getTicketVisibility,
    privateAccessCode,
    tickets,
  ]);

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

  const isExternalTicket = selectedTicket?.type === EXTERNAL_LINK_TYPE;
  const isRegistrationOnly = event?.saleMethod === "register";
  const registrationTickets = useMemo(
    () =>
      accessibleTickets.filter((ticket) => ticket.type !== EXTERNAL_LINK_TYPE),
    [accessibleTickets],
  );

  const externalLinkHost = useMemo(() => {
    if (!isExternalTicket || !selectedTicket?.link) return null;
    try {
      return new URL(selectedTicket.link).hostname.replace(/^www\./, "");
    } catch {
      return null;
    }
  }, [isExternalTicket, selectedTicket]);

  const handleOpenExternalLink = useCallback(() => {
    if (!selectedTicket?.link) {
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
  }, [event, selectedTicket, userDetails]);

  const totalPrice = useMemo(
    () => (selectedTicket?.price?.amount ?? 0) * quantity,
    [selectedTicket, quantity],
  );

  const formattedTotalPrice = useMemo(() => {
    if (!selectedTicket) return null;
    const { locale, code } = selectedTicket.price.currency;
    return formatCurrency(totalPrice, code, locale);
  }, [selectedTicket, totalPrice]);

  useEffect(() => {
    if (
      accessibleTickets.length > 0 &&
      (!selectedTicketId ||
        !accessibleTickets.some((ticket) => ticket.id === selectedTicketId))
    ) {
      setSelectedTicketId(accessibleTickets[0].id);
    }
  }, [accessibleTickets, selectedTicketId]);

  const handleSelectTicket = useCallback((ticketId: string) => {
    setSelectedTicketId(ticketId);
    setQuantity(1);
  }, []);

  const handleDecrement = useCallback(() => {
    setQuantity((prev) => Math.max(1, prev - 1));
  }, []);

  const maxQuantity = useMemo(
    () =>
      isRegistrationOnly
        ? Math.max(
            Math.min(
              event?.remainingRegistrationSpots ?? 1,
              selectedTicket?.available ?? selectedTicket?.quantity ?? 1,
            ),
            1,
          )
        : selectedTicket?.available ?? selectedTicket?.quantity ?? 10,
    [event?.remainingRegistrationSpots, isRegistrationOnly, selectedTicket],
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
          [userDetails.firstName, userDetails.lastName].filter(Boolean).join(" ") ||
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
          toast.success("Registration confirmed. Your ticket is available in your account.");
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

    if (!selectedTicket) {
      toast.error("Please select a ticket type");
      return;
    }

    if (quantity < 1) {
      toast.error("Please select at least one seat");
      return;
    }

    if (process.env.NODE_ENV === "development") {
      if (event) {
        joinEventChatGroup({
          event,
          user: userDetails,
          joinReason:
            (selectedTicket?.price?.amount ?? 0) > 0 ? "paid" : "registered",
        });
      }
      toast.success("You joined the event group chat");
      router.push(ROUTES.MESSAGES.href);
      return;
    }

    setIsPurchasing(true);
    try {
      const { data } = await postData<
        {
          ticketId: string;
          quantity: number;
          callbackUrl: string;
          privateAccessCode?: string;
        },
        { orderId: string; status: EOrderStatus; redirectUrl?: string }
      >("/order", {
        ticketId: selectedTicket.id,
        quantity,
        privateAccessCode:
          getTicketVisibility(selectedTicket) === "private"
            ? privateAccessCode
            : undefined,
        callbackUrl: `${window.location.origin}${ROUTES.PROFILE_ORDERS.href}/{{orderId}}/success`,
      });
      const redirectUrl = data?.data?.redirectUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }
      toast.success("Ticket purchased successfully!");
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
    userDetails,
    isRegistrationOnly,
    eventId,
    selectedTicket,
    quantity,
    router,
    event,
    getTicketVisibility,
    privateAccessCode,
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
      <button
        onClick={() => router.back()}
        className="p-2 -ml-2 hover:bg-accent rounded-full transition-colors cursor-pointer"
        aria-label="Go back"
      >
        <ArrowLeft className="size-5" />
      </button>

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
              className="w-full rounded-2xl border border-cyan-100 bg-cyan-50/70 p-5 text-left transition hover:border-cyan-200 hover:bg-cyan-50"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
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
                      {(event?.remainingRegistrationSpots ?? 0).toLocaleString()}
                    </p>
                    <p>
                      <span className="font-semibold text-secondary-950">Limit:</span>{" "}
                      {(event?.registrationLimit ?? event?.totalTickets ?? 0).toLocaleString()}
                    </p>
                    <p className="capitalize">
                      <span className="font-semibold text-secondary-950">Status:</span>{" "}
                      {event?.registrationStatus ?? "open"}
                    </p>
                  </div>
                </div>
                <span className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500 px-4 text-sm font-semibold text-white">
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
                    Select the registration category you want. Private categories
                    only appear when you open the organizer&apos;s invite link.
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

            {showRegistrationTypes && tickets.length > 0 && registrationTickets.length === 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
                <div className="flex items-start gap-3">
                  <LockKeyhole className="mt-0.5 size-5 shrink-0" />
                  <div>
                    <p className="font-semibold">No public registration type available</p>
                    <p className="mt-1 text-sm leading-6">
                      Private registration categories are hidden unless you open
                      the organizer&apos;s invite link.
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
                    className="size-9 rounded-full bg-cyan-500 text-white flex items-center justify-center transition-colors hover:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handlePurchase}
              disabled={
                isPurchasing ||
                event?.registrationStatus !== "open" ||
                (registrationTickets.length > 0 && !selectedTicket)
              }
              className="w-full h-14 text-lg font-semibold rounded-2xl bg-linear-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              {isPurchasing && "Registering..."}
              {!isPurchasing && "Register"}
            </button>
          </div>
        )}

        {!isRegistrationOnly && tickets.length > 0 && accessibleTickets.length === 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
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

        {!isRegistrationOnly && accessibleTickets.length > 0 && hiddenPrivateTicketCount > 0 && (
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4 text-sm text-cyan-900">
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
                  const isSelected = selectedTicketId === ticket.id;
                  const isExternal = ticket.type === EXTERNAL_LINK_TYPE;
                  const borderColor = isSelected
                    ? "border-cyan-800 dark:border-cyan-600"
                    : "border-border group-hover:border-cyan-400";
                  return (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => handleSelectTicket(ticket.id)}
                      className="text-left cursor-pointer flex flex-col group transition-all"
                    >
                      <div
                        className={cn(
                          "border-2 border-dashed px-5 pt-5 pb-6 flex-1 flex flex-col gap-4",
                          isExternal ? "rounded-xl" : "border-b-0 rounded-t-xl",
                          borderColor,
                          isSelected && "bg-cyan-50/30 dark:bg-cyan-950/20",
                        )}
                      >
                        <div className="size-12 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                          <TicketIcon className="size-6 text-cyan-700 dark:text-cyan-400" />
                        </div>
                        <p className="font-bold text-lg">{ticket.name}</p>
                      </div>

                      {!isExternal && (
                        <>
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
                              isSelected && "bg-cyan-50/30 dark:bg-cyan-950/20",
                            )}
                          >
                            <p className="font-semibold">
                              <span className="text-cyan-700 dark:text-cyan-400 font-bold text-base">
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
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
            </div>

            {isExternalTicket ? (
              <div className="space-y-4 border rounded-xl p-6 bg-cyan-50/30 dark:bg-cyan-950/10">
                <div className="flex items-start gap-3">
                  <ExternalLink className="size-5 text-cyan-700 dark:text-cyan-400 mt-0.5 shrink-0" />
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
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-lg">Number of Seats</p>
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
                      className="size-9 rounded-full bg-cyan-500 text-white flex items-center justify-center transition-colors hover:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>

                {selectedTicket?.available != null && (
                  <p className="text-sm text-muted-foreground text-right">
                    {selectedTicket.available} ticket
                    {selectedTicket.available !== 1 && "s"} available
                  </p>
                )}

                <div className="border-t" />

                <div className="flex items-center justify-between">
                  <p className="font-semibold text-lg">Total Price:</p>
                  <p className="text-xl font-bold text-cyan-600">
                    {(selectedTicket?.price?.amount ?? 0) > 0 &&
                      formattedTotalPrice}
                    {selectedTicket && !selectedTicket?.price?.amount && "Free"}
                    {!selectedTicket && formattedTotalPrice}
                  </p>
                </div>
              </div>
            )}

            {isExternalTicket ? (
              <button
                onClick={handleOpenExternalLink}
                disabled={!selectedTicket?.link}
                className="w-full h-14 text-lg font-semibold rounded-2xl bg-linear-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink className="size-5" />
                {externalLinkHost
                  ? `Proceed to ${externalLinkHost}`
                  : "Proceed to external site"}
              </button>
            ) : (
              <button
                onClick={handlePurchase}
                disabled={!selectedTicket || isPurchasing}
                className="w-full h-14 text-lg font-semibold rounded-2xl bg-linear-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                {isPurchasing && "Processing..."}
                {!isPurchasing && "Continue"}
              </button>
            )}
          </>
        )}
      </div>
    </SectionContainer>
  );
};

export default memo(TicketPage);
