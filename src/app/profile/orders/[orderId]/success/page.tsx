"use client";

import { constructErrorMessage } from "@/api/functions";
import { getData } from "@/api";
import SectionContainer from "@/components/layouts/section-container/section-container";
import { Button } from "@/components/ui/button";
import ErrorContainer from "@/components/ui/error-container";
import { Skeleton } from "@/components/ui/skeleton";
import { IOrderDetailsType } from "@/lib/types";
import { ROUTES } from "@/lib/variables";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CheckCircle2,
  Download,
  Loader2,
  CalendarDays,
  MapPin,
  TicketIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import ViewTicketsDialog from "@/components/ticket-design/view-tickets-dialog";

const getOrder = async (orderId: string) => {
  const { data } = await getData<IOrderDetailsType>(`/order/${orderId}`);
  return data?.data;
};

const OrderSuccessPage = () => {
  const params = useParams();
  const orderId = params?.orderId?.toString() || "";
  const [isDownloading, setIsDownloading] = useState(false);
  const [showTicketsDialog, setShowTicketsDialog] = useState(false);
  const [pendingDownloadAll, setPendingDownloadAll] = useState(false);

  const {
    data: order,
    error,
    refetch,
  } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId),
    enabled: !!orderId,
  });

  const event = useMemo(
    () => order?.ticket?.event?.data,
    [order?.ticket?.event?.data],
  );

  const captureAndDownloadAll = useCallback(async () => {
    if (!order?.userTickets?.length) return;

    setIsDownloading(true);
    try {
      const [JSZip, html2canvas] = await Promise.all([
        import("jszip").then((m) => m.default),
        import("html2canvas").then((m) => m.default),
      ]);
      const zip = new JSZip();

      const ticketCards = document.querySelectorAll<HTMLDivElement>(
        "[data-ticket-card]",
      );

      if (ticketCards.length === 0) {
        toast.error("No ticket cards found to capture.");
        return;
      }

      let addedCount = 0;
      for (let i = 0; i < ticketCards.length; i++) {
        try {
          const canvas = await html2canvas(ticketCards[i], {
            scale: 3,
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: false,
          });
          const blob = await new Promise<Blob>((resolve) =>
            canvas.toBlob((b) => resolve(b!), "image/png"),
          );
          const code = order.userTickets[i]?.code ?? `ticket-${i + 1}`;
          zip.file(`${code}.png`, blob);
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
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${eventName}-tickets.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      if (addedCount < order.userTickets.length) {
        toast.warning(
          `Downloaded ${addedCount} of ${order.userTickets.length} tickets.`,
        );
      } else {
        toast.success("Tickets downloaded successfully!");
      }
    } catch {
      toast.error("Failed to download tickets. Please try again.");
    } finally {
      setIsDownloading(false);
      setPendingDownloadAll(false);
    }
  }, [order, event]);

  const handleDownloadTickets = useCallback(() => {
    if (!order?.userTickets?.length) {
      toast.error("No tickets available to download");
      return;
    }
    setShowTicketsDialog(true);
    setPendingDownloadAll(true);
  }, [order]);

  useEffect(() => {
    if (!pendingDownloadAll || !showTicketsDialog) return;
    const timer = setTimeout(() => captureAndDownloadAll(), 600);
    return () => clearTimeout(timer);
  }, [pendingDownloadAll, showTicketsDialog, captureAndDownloadAll]);

  if (!order && !error) {
    return (
      <SectionContainer className="py-20 max-w-2xl space-y-8">
        <div className="flex flex-col items-center gap-6">
          <Skeleton className="size-20 rounded-full" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
      </SectionContainer>
    );
  }

  if (error) {
    return (
      <SectionContainer className="py-20 min-h-[500px] flex items-center justify-center">
        <ErrorContainer
          error={constructErrorMessage(
            error as TApiErrorResponseType,
            "Unable to load order details",
          )}
          retryFunction={refetch}
        />
      </SectionContainer>
    );
  }

  const eventDate = event?.date ? new Date(event.date) : null;
  const totalFormatted =
    order?.totalAmount?.formatted?.withCurrency ??
    order?.ticket?.price?.formatted?.withCurrency ??
    "Free";

  return (
    <SectionContainer className="py-20 max-w-2xl space-y-10">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="size-20 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
          <CheckCircle2 className="size-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold">Payment Successful!</h1>
        <p className="text-muted-foreground">
          Your tickets have been confirmed. You can download them below.
        </p>
      </div>

      <div className="border rounded-xl divide-y">
        <div className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">Order Summary</h2>

          <div className="space-y-3 text-sm">
            {event?.name && (
              <div className="flex items-start gap-3">
                <TicketIcon className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium">{event.name}</p>
                  {order?.userTickets?.[0]?.ticket?.name && (
                    <p className="text-muted-foreground">
                      {order.userTickets[0].ticket.name}
                      {order.userTickets.length > 1 &&
                        ` + ${order.userTickets.length - 1} more`}
                    </p>
                  )}
                </div>
              </div>
            )}

            {eventDate && (
              <div className="flex items-center gap-3">
                <CalendarDays className="size-4 text-muted-foreground shrink-0" />
                <p>{format(eventDate, "EEEE, MMMM d, yyyy 'at' h:mm a")}</p>
              </div>
            )}

            {event?.venue?.name && (
              <div className="flex items-center gap-3">
                <MapPin className="size-4 text-muted-foreground shrink-0" />
                <p>
                  {event.venue.name}
                  {event.venue.address && ` — ${event.venue.address}`}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Quantity</span>
            <span className="font-medium">
              {order?.quantity ?? order?.userTickets?.length ?? 0}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Order ID</span>
            <span className="font-mono text-xs">{orderId}</span>
          </div>
          <div className="border-t pt-3 flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-lg">{totalFormatted}</span>
          </div>
        </div>
      </div>

      {order?.userTickets && order.userTickets.length > 0 && (
        <ViewTicketsDialog
          open={showTicketsDialog}
          onOpenChange={setShowTicketsDialog}
          userTickets={order.userTickets}
          event={event}
        />
      )}

      <div className="space-y-3">
        <Button
          onClick={handleDownloadTickets}
          disabled={isDownloading || !order?.userTickets?.length}
          loading={isDownloading}
          className="w-full h-14 text-lg font-semibold rounded-2xl bg-linear-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white border-0"
        >
          {isDownloading && <Loader2 className="size-5 animate-spin" />}
          {!isDownloading && <Download className="size-5" />}
          {isDownloading && "Preparing Download..."}
          {!isDownloading && "Download Tickets"}
        </Button>

        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="flex-1 h-12 rounded-xl">
            <Link href={ROUTES.PROFILE_ORDERS.href}>View Orders</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 h-12 rounded-xl">
            <Link href={ROUTES.EXPLORE.href}>Explore Events</Link>
          </Button>
        </div>
      </div>
    </SectionContainer>
  );
};

export default memo(OrderSuccessPage);
