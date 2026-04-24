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
import { useParams, useRouter } from "next/navigation";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Minus, Plus, TicketIcon } from "lucide-react";
import { EOrderStatus } from "@/lib/types";

const EXTERNAL_LINK_TYPE = "EXTERNAL_LINK";

const TicketPage = () => {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id?.toString() || "";
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

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selectedTicketId) ?? null,
    [tickets, selectedTicketId],
  );

  const isExternalTicket = selectedTicket?.type === EXTERNAL_LINK_TYPE;

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
    if (tickets.length > 0 && !selectedTicketId) {
      setSelectedTicketId(tickets[0].id);
    }
  }, [tickets, selectedTicketId]);

  const handleSelectTicket = useCallback((ticketId: string) => {
    setSelectedTicketId(ticketId);
    setQuantity(1);
  }, []);

  const handleDecrement = useCallback(() => {
    setQuantity((prev) => Math.max(1, prev - 1));
  }, []);

  const maxQuantity = useMemo(
    () => selectedTicket?.available ?? selectedTicket?.quantity ?? 10,
    [selectedTicket],
  );

  const handleIncrement = useCallback(() => {
    setQuantity((prev) => Math.min(maxQuantity, prev + 1));
  }, [maxQuantity]);

  const handlePurchase = useCallback(async () => {
    if (!userDetails) {
      toast.error("Please log in to purchase tickets");
      const redirect = encodeURIComponent(window.location.pathname);
      router.push(`${ROUTES.LOGIN.href}?redirect=${redirect}`);
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
        { ticketId: string; quantity: number; callbackUrl: string },
        { orderId: string; status: EOrderStatus; redirectUrl?: string }
      >("/order", {
        ticketId: selectedTicket.id,
        quantity,
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
  }, [userDetails, selectedTicket, quantity, router, event]);

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

        {tickets.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <TicketIcon className="size-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">No tickets available</p>
            <p className="text-sm mt-1">
              Tickets for this event are not yet on sale.
            </p>
          </div>
        )}

        {tickets.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tickets
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
