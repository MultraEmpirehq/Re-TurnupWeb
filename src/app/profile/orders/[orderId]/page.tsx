"use client";

import OrderMoneyBack from "@/components/pages/profile/order-money-back";
import OrderHelp from "@/components/pages/profile/order-help";
import { getData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import ErrorContainer from "@/components/ui/error-container";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { EOrderStatus, IOrderDetailsType } from "@/lib/types";
import {
  orderStatusMeta,
  orderTicketsLabel,
  orderTotalLabel,
} from "@/lib/order-status";
import { ROUTES } from "@/lib/variables";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Download, QrCode, TicketIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { memo, useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import TicketCard from "@/components/ticket-design/ticket-card";
import {
  PASS_COLOUR,
  PassHeader,
  PassViewer,
  TEventTickets,
  statusOf,
} from "@/components/ticket-design/ticket-wallet";
import { useUserTickets } from "@/hooks/use-user-tickets";

const OrderDetailPage = () => {
  const params = useParams();
  const orderId = params?.orderId?.toString() ?? "";
  const [isDownloading, setIsDownloading] = useState(false);

  const {
    data: order,
    error,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const { data } = await getData<IOrderDetailsType>(`/order/${orderId}`);
      return data?.data;
    },
    enabled: !!orderId,
  });

  const event = useMemo(
    () => order?.ticket?.event?.data ?? order?.ticket?.event,
    [order?.ticket?.event],
  );

  // The order's tickets as passes (with their live codes), from your wallet.
  const { data: wallet } = useUserTickets();
  const passes = useMemo<TEventTickets | null>(() => {
    const tickets = (wallet?.data ?? []).filter(
      (ticket) => ticket.orderId === orderId,
    );
    const passEvent = tickets[0]?.ticket?.event ?? event;
    return tickets.length && passEvent ? { event: passEvent, tickets } : null;
  }, [wallet?.data, orderId, event]);
  const [openAt, setOpenAt] = useState<number | null>(null);
  const closePasses = useCallback(() => setOpenAt(null), []);

  const captureAndDownloadAll = useCallback(async () => {
    if (!order?.userTickets?.length) return;

    setIsDownloading(true);
    try {
      const [JSZip, html2canvas, jspdfModule] = await Promise.all([
        import("jszip").then((m) => m.default),
        import("html2canvas-pro").then((m) => m.default),
        import("jspdf"),
      ]);
      const jsPDF = jspdfModule.default ?? jspdfModule.jsPDF;
      const zip = new JSZip();

      const ticketCards =
        document.querySelectorAll<HTMLDivElement>("[data-ticket-card]");

      if (ticketCards.length === 0) {
        toast.error("No ticket cards found to capture.");
        return;
      }

      let addedCount = 0;
      for (let i = 0; i < ticketCards.length; i++) {
        try {
          await new Promise((r) => setTimeout(r, 50));
          const canvas = await html2canvas(ticketCards[i], {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: false,
          });
          const imgData = canvas.toDataURL("image/png");
          const code = order.userTickets[i]?.code ?? `ticket-${i + 1}`;

          const pdf = new jsPDF({
            orientation:
              canvas.width > canvas.height ? "landscape" : "portrait",
            unit: "px",
            format: [canvas.width, canvas.height],
          });
          pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
          const pdfBlob = pdf.output("blob");
          zip.file(`${code}.pdf`, pdfBlob);
          addedCount++;
        } catch {
          /* skip failed ticket */
        }
      }

      if (addedCount === 0) {
        toast.error("Could not capture any tickets. Please try again.");
        return;
      }

      const eventName = (event?.name ?? "tickets")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const downloadDate = format(new Date(), "yyyy-MM-dd");
      const zipFilename = `${eventName}-${downloadDate}-${orderId}.zip`;
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = zipFilename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      if (addedCount < order.userTickets.length) {
        toast.warning(
          `Downloaded ${addedCount} of ${order.userTickets.length} tickets.`,
        );
      } else {
        toast.success("All tickets downloaded!");
      }
    } catch {
      toast.error("Failed to download tickets");
    } finally {
      setIsDownloading(false);
    }
  }, [order, event, orderId]);

  const handleDownloadTickets = useCallback(() => {
    if (!order?.userTickets?.length) {
      toast.error("No tickets available to download");
      return;
    }
    setTimeout(() => captureAndDownloadAll(), 300);
  }, [order, captureAndDownloadAll]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ErrorContainer
          error={constructErrorMessage(
            error as TApiErrorResponseType,
            "Failed to load order details",
          )}
          retryFunction={refetch}
        />
      </div>
    );
  }

  if (!order) return null;

  const totalFormatted = orderTotalLabel(order);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={ROUTES.PROFILE_ORDERS.href}
          className="p-2 -ml-2 hover:bg-accent rounded-full transition-colors"
          aria-label="Back to orders"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h2 className="text-lg font-semibold">Order Details</h2>
      </div>

      <div className="overflow-hidden rounded-2xl border">
        {event ? (
          <PassHeader
            event={event}
            colour={PASS_COLOUR}
            right={
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                  orderStatusMeta(order.status).className,
                )}
              >
                {orderStatusMeta(order.status).label}
              </span>
            }
          />
        ) : (
          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <p className="text-lg font-bold">Event</p>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                orderStatusMeta(order.status).className,
              )}
            >
              {orderStatusMeta(order.status).label}
            </span>
          </div>
        )}
        <div className="space-y-5 p-4 sm:p-6">
          {/* Why the order ended up where it did, or how long its seats are held. */}
          {order.statusReason && order.status !== EOrderStatus.COMPLETED && (
            <p
              className={cn(
                "rounded-xl px-4 py-3 text-sm",
                order.status === EOrderStatus.REFUNDED
                  ? "bg-sky-50 text-sky-800"
                  : order.status === EOrderStatus.NEEDS_REVIEW
                    ? "bg-secondary-50 text-secondary-800"
                    : "bg-red-50 text-red-700",
              )}
            >
              {order.statusReason}
              {order.status === EOrderStatus.NEEDS_REVIEW &&
                " Our team has been alerted and will get back to you."}
            </p>
          )}
          {order.status === EOrderStatus.PENDING && order.holdExpiresAt && (
            <p className="rounded-xl bg-secondary-50 px-4 py-3 text-sm text-secondary-800">
              Your seats are held until{" "}
              {format(new Date(order.holdExpiresAt), "h:mm a")}. Finish paying
              before then to keep them.
            </p>
          )}

          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Tickets
            </p>
            {passes ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {passes.tickets.map((ticket, index) => {
                  const status = statusOf(ticket, passes.event);
                  return (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => setOpenAt(index)}
                      className="flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition hover:border-primary hover:bg-primary-50/40 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0b1d2a] text-white">
                        <QrCode className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          {ticket.ticket?.name ?? "Ticket"}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground tabular-nums">
                          {ticket.code}
                        </span>
                      </span>
                      <span className="text-right">
                        <span
                          className={cn(
                            "inline-block rounded-full px-2 py-0.5 text-[11px] font-bold",
                            status.className,
                          )}
                        >
                          {status.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {ticket.ticket?.price?.formatted?.withCurrency ??
                            "Free"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              order.userTickets?.map((ut, i) => (
                <div
                  key={ut.id ?? i}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <TicketIcon className="size-4 text-primary-700 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{ut.ticket.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {ut.ticket.type?.toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {ut.ticket.price?.formatted?.withCurrency ?? "Free"}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {ut.code}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {(order.items?.length ?? 0) > 1
                  ? orderTicketsLabel(order)
                  : `${order.quantity} ticket${order.quantity !== 1 ? "s" : ""}`}
              </p>
              {order.createdAt && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ordered {format(new Date(order.createdAt), "MMM dd, yyyy")}
                </p>
              )}
              <OrderMoneyBack order={order} className="mt-2" />
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold">{totalFormatted}</p>
            </div>
          </div>
        </div>
      </div>

      {order?.status === EOrderStatus.COMPLETED &&
        order?.userTickets?.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            {passes && (
              <Button
                onClick={() => setOpenAt(0)}
                className="gap-2 rounded-full"
              >
                <QrCode className="size-4" />
                {passes.tickets.length > 1
                  ? `Show your ${passes.tickets.length} passes`
                  : "Show your pass"}
              </Button>
            )}
            <Button
              onClick={handleDownloadTickets}
              loading={isDownloading}
              variant="outline"
              className="gap-2 rounded-full"
            >
              <Download className="size-4" />
              Download All Tickets
            </Button>
          </div>
        )}

      <div className="space-y-2">
        {order.reference && (
          <p className="text-sm text-muted-foreground">
            Order number{" "}
            <span className="font-semibold tracking-wide text-foreground">
              {order.reference}
            </span>
          </p>
        )}
        <OrderHelp
          reference={order.reference ?? order.id}
          eventName={event?.name}
        />
      </div>

      {/* Off-screen ticket cards for "Download all" capture (painted but not visible) */}
      {order?.userTickets?.length ? (
        <div
          aria-hidden="true"
          className="fixed left-[-9999px] top-0 z-[-1] w-[400px]"
        >
          {(order.userTickets ?? []).map((ut, i) => (
            <TicketCard
              key={ut.id ?? i}
              userTicket={ut}
              event={event}
              index={i}
            />
          ))}
        </div>
      ) : null}

      <PassViewer
        group={openAt === null ? null : passes}
        colour={PASS_COLOUR}
        startAt={openAt ?? 0}
        hideOrderLink
        onClose={closePasses}
      />
    </div>
  );
};

export default memo(OrderDetailPage);
