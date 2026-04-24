"use client";

import { getData } from "@/api";
import { constructErrorMessage } from "@/api/functions";
import ErrorContainer from "@/components/ui/error-container";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { EOrderStatus, IOrderDetailsType } from "@/lib/types";
import { ROUTES } from "@/lib/variables";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  Eye,
  MapPin,
  TicketIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { memo, useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import TicketCard from "@/components/ticket-design/ticket-card";
import ViewTicketsDialog from "@/components/ticket-design/view-tickets-dialog";

const statusStyles: Record<EOrderStatus, string> = {
  [EOrderStatus.COMPLETED]:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  [EOrderStatus.PENDING]:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  [EOrderStatus.FAILED]:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const OrderDetailPage = () => {
  const params = useParams();
  const orderId = params?.orderId?.toString() ?? "";
  const [isDownloading, setIsDownloading] = useState(false);
  const [showTicketsDialog, setShowTicketsDialog] = useState(false);

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
    () => order?.ticket?.event?.data,
    [order?.ticket?.event?.data],
  );

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
            orientation: canvas.width > canvas.height ? "landscape" : "portrait",
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

  const totalFormatted = order.ticket?.price?.formatted?.withCurrency ?? "Free";

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

      <div className="border rounded-xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-bold text-lg">{event?.name ?? "Event"}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              {event?.date && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-3.5" />
                  {format(new Date(event.date), "MMM dd, yyyy · h:mm a")}
                </span>
              )}
              {event?.venue?.name && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {event.venue.name}
                </span>
              )}
            </div>
          </div>
          <span
            className={cn(
              "text-xs font-medium px-2.5 py-0.5 rounded-full capitalize shrink-0",
              statusStyles[order.status] ?? statusStyles.PENDING,
            )}
          >
            {order.status?.toLowerCase()}
          </span>
        </div>

        <Separator />

        <div className="space-y-3">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Tickets
          </p>
          {order.userTickets?.map((ut, i) => (
            <div
              key={ut.id ?? i}
              className="flex items-center justify-between gap-3 py-2"
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                  <TicketIcon className="size-4 text-cyan-700 dark:text-cyan-400" />
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
          ))}
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {order.quantity} ticket{order.quantity !== 1 && "s"}
            </p>
            {order.createdAt && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Ordered {format(new Date(order.createdAt), "MMM dd, yyyy")}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold">{totalFormatted}</p>
          </div>
        </div>
      </div>

      {order?.status === EOrderStatus.COMPLETED &&
        order?.userTickets?.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setShowTicketsDialog(true)}
              variant="outline"
              className="gap-2"
            >
              <Eye className="size-4" />
              View Tickets
            </Button>
            <Button
              onClick={handleDownloadTickets}
              loading={isDownloading}
              className="gap-2"
            >
              <Download className="size-4" />
              Download All Tickets
            </Button>
          </div>
        )}

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

      <ViewTicketsDialog
        open={showTicketsDialog}
        onOpenChange={setShowTicketsDialog}
        userTickets={order.userTickets ?? []}
        event={event}
      />
    </div>
  );
};

export default memo(OrderDetailPage);
